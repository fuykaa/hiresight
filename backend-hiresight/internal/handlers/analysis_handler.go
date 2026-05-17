package handlers

import (
	"archive/zip"
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"
	"backend-hiresight/internal/services"
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type AnalysisHandler struct {
	Repo       *repository.AnalysisRepository
	ResumeRepo *repository.ResumeRepository
}

// POST /api/analysis/:resume_id
func (h *AnalysisHandler) TriggerAnalysis(c *gin.Context) {
	resumeID := c.Param("resume_id")
	userID, _ := c.Get("userID")

	// 1. Pastikan resume milik user yang login
	resume, err := h.ResumeRepo.FindByIDAndUser(resumeID, userID.(string))
	if err != nil {
		c.JSON(403, gin.H{"error": "Akses dilarang"})
		return
	}

	// 1b. Opsional: baca job_description baru dari body (untuk re-analyze)
	var body struct {
		JobDescription string `json:"job_description"`
	}
	c.ShouldBindJSON(&body)
	if strings.TrimSpace(body.JobDescription) != "" {
		if err := h.ResumeRepo.UpdateJobDescription(resumeID, userID.(string), body.JobDescription); err != nil {
			c.JSON(500, gin.H{"error": "Gagal update job description"})
			return
		}
		resume.JobDescription = body.JobDescription
	}

	// 2. Buat record awal dengan status 'processing'
	newAnalysis := models.AnalysisResult{
		ID:       uuid.New(),
		ResumeID: resume.ID,
		Status:   "processing",
	}
	h.Repo.Save(&newAnalysis)

	// 3. Jalankan analisis AI di background goroutine
	go h.runAnalysis(&newAnalysis, resume.FilePath, resume.FileType, resume.JobDescription, resume.JobPosition)

	c.JSON(202, gin.H{"message": "Analisis dimulai", "analysis_id": newAnalysis.ID, "status": "processing"})
}

// GET /api/analysis/stats
func (h *AnalysisHandler) GetStats(c *gin.Context) {
	userID, _ := c.Get("userID")
	count, highestScore, topResumeID, err := h.Repo.GetStatsByUser(userID.(string))
	if err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil statistik"})
		return
	}
	c.JSON(200, gin.H{"completed_count": count, "highest_score": highestScore, "highest_score_resume_id": topResumeID})
}

// GET /api/analysis/:resume_id
func (h *AnalysisHandler) GetResult(c *gin.Context) {
	resumeID := c.Param("resume_id")
	userID, _ := c.Get("userID")

	result, err := h.Repo.GetResultWithSecurity(resumeID, userID.(string))
	if err != nil {
		c.JSON(404, gin.H{"error": "Hasil belum tersedia"})
		return
	}

	c.JSON(200, result)
}

// runAnalysis dijalankan sebagai goroutine — download dari blob, ekstrak teks, panggil Groq, hitung skor, simpan ke DB
func (h *AnalysisHandler) runAnalysis(analysis *models.AnalysisResult, blobName, fileType, jobDescription, jobPosition string) {
	markFailed := func(msg string, err error) {
		analysis.Status = "failed"
		h.Repo.Save(analysis)
		log.Printf("[runAnalysis] %s untuk resume_id=%s: %v", msg, analysis.ResumeID, err)
	}

	// 1. Download file dari Azure Blob Storage
	resumesContainer := os.Getenv("AZURE_STORAGE_CONTAINER_RESUMES")
	if resumesContainer == "" {
		resumesContainer = "resumes"
	}

	fileBytes, err := services.DownloadBlobBytes(resumesContainer, blobName)
	if err != nil {
		markFailed("Gagal download file dari blob", err)
		return
	}

	// 2. Ekstrak teks berdasarkan tipe file
	var cvText string
	switch strings.ToLower(fileType) {
	case "docx":
		cvText, err = extractDOCXFromBytes(fileBytes)
	default:
		cvText, err = services.ExtractPDFWithFormRecognizer(fileBytes)
	}
	if err != nil || len(strings.TrimSpace(cvText)) < 100 {
		markFailed("Ekstraksi teks gagal atau terlalu pendek", err)
		return
	}

	// 3. Panggil Groq API
	geminiResult, err := services.AnalyzeWithGroq(cvText, jobDescription)
	if err != nil {
		markFailed("Groq API error", err)
		return
	}

	// 4. Hitung sections_nonstandard di Go dari selisih all_headers vs sections_detected
	geminiResult.SectionsNonstandard = services.ComputeNonstandard(
		geminiResult.AllHeadersDetected,
		geminiResult.SectionsDetected,
	)

	// 5. Hitung skor dan generate feedback deterministik
	scores := services.CalculateScores(geminiResult, jobPosition)
	feedbackFormat, feedbackContent, feedbackKeywords := services.GenerateFeedback(geminiResult, scores)

	// 6. Marshal keyword list ke JSON untuk disimpan di kolom keyword_analysis
	keywordsJSON, err := json.Marshal(geminiResult.Keywords)
	if err != nil {
		markFailed("Gagal marshal keywords", err)
		return
	}

	// 7. Update record dengan hasil lengkap
	analysis.OverallScore     = scores.OverallScore
	analysis.ATSScore         = scores.ATSScore
	analysis.KeywordScore     = scores.KeywordScore
	analysis.FormatScore      = scores.FormatScore
	analysis.KeywordAnalysis  = datatypes.JSON(keywordsJSON)
	analysis.CandidateProfile = geminiResult.CandidateProfile
	analysis.FeedbackFormat   = feedbackFormat
	analysis.FeedbackContent  = feedbackContent
	analysis.FeedbackKeywords = feedbackKeywords
	analysis.Status           = "completed"

	if err := h.Repo.Save(analysis); err != nil {
		log.Printf("[runAnalysis] Gagal simpan hasil ke DB untuk resume_id=%s: %v", analysis.ResumeID, err)
	}
}

// extractDOCXFromBytes mengekstrak teks dari bytes DOCX (Office Open XML).
func extractDOCXFromBytes(data []byte) (string, error) {
	const wNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("bukan file DOCX yang valid: %w", err)
	}

	for _, f := range r.File {
		if f.Name != "word/document.xml" {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return "", err
		}
		defer rc.Close()

		var sb strings.Builder
		decoder := xml.NewDecoder(rc)
		inText := false

		for {
			tok, err := decoder.Token()
			if err == io.EOF {
				break
			}
			if err != nil {
				return "", fmt.Errorf("gagal parse XML DOCX: %w", err)
			}
			switch t := tok.(type) {
			case xml.StartElement:
				switch {
				case t.Name.Space == wNS && t.Name.Local == "t":
					inText = true
				case t.Name.Local == "p":
					sb.WriteString("\n")
				}
			case xml.EndElement:
				if t.Name.Space == wNS && t.Name.Local == "t" {
					inText = false
				}
			case xml.CharData:
				if inText {
					sb.Write(t)
					sb.WriteString(" ")
				}
			}
		}

		return strings.TrimSpace(sb.String()), nil
	}

	return "", fmt.Errorf("bukan file DOCX yang valid: word/document.xml tidak ditemukan")
}
