package handlers

import (
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"
	"backend-hiresight/internal/services"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ResumeHandler struct {
	Repo *repository.ResumeRepository
}

func resumesContainer() string {
	if v := os.Getenv("AZURE_STORAGE_CONTAINER_RESUMES"); v != "" {
		return v
	}
	return "resumes"
}

func (h *ResumeHandler) UploadResume(c *gin.Context) {
	val, _ := c.Get("userID")
	userID := val.(string)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"error": "File tidak ditemukan"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".docx" {
		c.JSON(400, gin.H{"error": "Hanya file PDF atau DOCX yang didukung"})
		return
	}

	jobPosition := c.PostForm("job_position")
	jobDescription := c.PostForm("job_description")

	// Baca bytes dari multipart file
	f, err := file.Open()
	if err != nil {
		c.JSON(500, gin.H{"error": "Gagal membaca file"})
		return
	}
	defer f.Close()
	fileBytes, err := io.ReadAll(f)
	if err != nil {
		c.JSON(500, gin.H{"error": "Gagal membaca file"})
		return
	}

	// Upload ke Azure Blob Storage; blob name = uuid-filename
	blobName := uuid.New().String() + "-" + file.Filename
	if err := services.UploadToBlob(resumesContainer(), blobName, fileBytes); err != nil {
		c.JSON(500, gin.H{"error": "Gagal menyimpan file ke storage"})
		return
	}

	fileType := strings.TrimPrefix(ext, ".")
	newResume := models.Resume{
		UserID:         uuid.MustParse(userID),
		FileName:       file.Filename,
		FilePath:       blobName, // simpan blob name, bukan local path
		FileType:       fileType,
		JobPosition:    jobPosition,
		JobDescription: jobDescription,
	}

	if err := h.Repo.DB.Create(&newResume).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mencatat data ke database"})
		return
	}

	c.JSON(200, gin.H{"message": "Resume berhasil diupload!", "data": newResume})
}

func (h *ResumeHandler) GetResumeByID(c *gin.Context) {
	resumeID := c.Param("id")
	val, _ := c.Get("userID")
	userID := val.(string)

	resume, err := h.Repo.FindByIDAndUser(resumeID, userID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Resume tidak ditemukan atau Anda tidak memiliki akses"})
		return
	}

	c.JSON(200, resume)
}

func (h *ResumeHandler) GetAllResumes(c *gin.Context) {
	val, _ := c.Get("userID")
	userID := val.(string)

	resumes, err := h.Repo.FindAllByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar resume"})
		return
	}

	c.JSON(http.StatusOK, resumes)
}

func (h *ResumeHandler) DeleteResume(c *gin.Context) {
	resumeID := c.Param("id")
	val, _ := c.Get("userID")
	userID := val.(string)

	resume, err := h.Repo.FindByIDAndUser(resumeID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume tidak ditemukan atau akses ditolak"})
		return
	}

	if err := h.Repo.Delete(resumeID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data di database"})
		return
	}

	if err := services.DeleteBlob(resumesContainer(), resume.FilePath); err != nil {
		log.Printf("Gagal hapus blob resume: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume berhasil dihapus"})
}

func (h *ResumeHandler) PreviewResume(c *gin.Context) {
	resumeID := c.Param("id")
	val, _ := c.Get("userID")
	userID := val.(string)

	resume, err := h.Repo.FindByIDAndUser(resumeID, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki akses ke dokumen ini"})
		return
	}

	fileBytes, err := services.DownloadBlobBytes(resumesContainer(), resume.FilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil file dari storage"})
		return
	}

	contentType := "application/pdf"
	if strings.ToLower(resume.FileType) == "docx" {
		contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	}

	if c.Query("download") == "true" {
		c.Header("Content-Disposition", "attachment; filename="+resume.FileName)
	} else {
		c.Header("Content-Disposition", "inline")
	}

	c.Data(http.StatusOK, contentType, fileBytes)
}
