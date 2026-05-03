package handlers

import (
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ResumeHandler struct {
	Repo *repository.ResumeRepository
}

func (h *ResumeHandler) UploadResume(c *gin.Context) {
	// 1. Ambil userID dari middleware
	val, _ := c.Get("userID")
	userID := val.(string)

	// 2. Ambil file dari form-data
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"error": "File tidak ditemukan"})
		return
	}

	// 3. Ambil data teks tambahan
	jobPosition := c.PostForm("job_position")
	jobDescription := c.PostForm("job_description")

	// 4. Tentukan lokasi penyimpanan (misal folder ./uploads)
	filePath := "./uploads/resumes/" + uuid.New().String() + "-" + file.Filename
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(500, gin.H{"error": "Gagal menyimpan file"})
		return
	}

	// 5. Simpan metadata ke tabel resumes
	newResume := models.Resume{
		UserID:         uuid.MustParse(userID),
		FileName:       file.Filename,
		FilePath:       filePath,
		FileType:       "pdf", // Bisa didapat dari ekstensi file
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
	// 1. Ambil ID dari URL parameter
	resumeID := c.Param("id")

	// 2. Ambil userID dari context (dari middleware)
	val, _ := c.Get("userID")
	userID := val.(string)

	// 3. Panggil repository
	resume, err := h.Repo.FindByIDAndUser(resumeID, userID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Resume tidak ditemukan atau Anda tidak memiliki akses"})
		return
	}

	c.JSON(200, resume)
}

func (h *ResumeHandler) GetAllResumes(c *gin.Context) {
	// 1. Ambil userID dari middleware
	val, _ := c.Get("userID")
	userID := val.(string)

	// 2. Panggil repository
	resumes, err := h.Repo.FindAllByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar resume"})
		return
	}

	// 3. Kembalikan dalam bentuk array/slice
	c.JSON(http.StatusOK, resumes)
}

func (h *ResumeHandler) DeleteResume(c *gin.Context) {
	resumeID := c.Param("id")
	val, _ := c.Get("userID")
	userID := val.(string)

	// 1. Cari dulu datanya untuk mendapatkan FilePath
	resume, err := h.Repo.FindByIDAndUser(resumeID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume tidak ditemukan atau akses ditolak"})
		return
	}

	// 2. Hapus data di database
	if err := h.Repo.Delete(resumeID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data di database"})
		return
	}

	// 3. Hapus file fisik di storage
	err = os.Remove(resume.FilePath)
	if err != nil {
		log.Printf("Gagal hapus file fisik: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume dan file fisik berhasil dihapus"})
}

func (h *ResumeHandler) PreviewResume(c *gin.Context) {
    // 1. Ambil ID resume dari URL parameter (:id)
    resumeID := c.Param("id")

    // 2. Ambil userID dari context (hasil set dari AuthMiddleware)
    val, _ := c.Get("userID")
    userID := val.(string)

    // 3. Cari metadata resume di database
    resume, err := h.Repo.FindByIDAndUser(resumeID, userID)
    if err != nil {
        // Jika tidak ditemukan atau bukan miliknya, beri respon 403 Forbidden
        c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki akses ke dokumen ini"})
        return
    }
		isDownload := c.Query("download")
				if isDownload == "true" {
						c.Header("Content-Disposition", "attachment; filename="+resume.FileName)
				} else {
						c.Header("Content-Disposition", "inline") // Ini akan preview
				}
    // 4. Kirim file fisik ke browser
    c.File(resume.FilePath)
}