package handlers

import (
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	// 2. Buat record awal dengan status 'processing'
	newAnalysis := models.AnalysisResult{
		ID:       uuid.New(),
		ResumeID: resume.ID,
		Status:   "processing",
	}
	h.Repo.Save(&newAnalysis)

	// 3. (Opsional) Di sini kamu panggil script Python AI kamu
	// go h.CallPythonAI(resume.FilePath, newAnalysis.ID)

	c.JSON(202, gin.H{"message": "Analisis dimulai", "status": "processing"})
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