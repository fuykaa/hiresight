package handlers

import (
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	Repo *repository.UserRepository
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi tidak valid"})
		return
	}

	// 2. Tentukan field apa saja yang boleh diupdate
	var input struct {
		FullName string `json:"full_name"`
		Bio      string `json:"bio"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	// 3. Siapkan data untuk diupdate (hanya masukkan yang tidak kosong)
	updateData := make(map[string]interface{})
	if input.FullName != "" {
		updateData["full_name"] = input.FullName
	}
	if input.Bio != "" {
		updateData["bio"] = input.Bio
	}

	// 4. Eksekusi update
	if err := h.Repo.UpdateProfile(userID.(string), updateData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profil berhasil diperbarui"})
}

func (h *ProfileHandler) GetMyProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	profile, err := h.Repo.GetProfileByUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profil tidak ditemukan"})
		return
	}

	user, err := h.Repo.FindByUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          profile.ID,
		"user_id":     profile.UserID,
		"full_name":   profile.FullName,
		"bio":         profile.Bio,
		"avatar_path": profile.AvatarPath,
		"updated_at":  profile.UpdatedAt,
		"email":       user.Email,
	})
}

func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
    userID, _ := c.Get("userID")

    file, err := c.FormFile("avatar")
    if err != nil {
        c.JSON(400, gin.H{"error": "File tidak ditemukan"})
        return
    }

    // Validasi: Pastikan yang diupload adalah gambar
    ext := filepath.Ext(file.Filename)
    if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
        c.JSON(400, gin.H{"error": "Hanya file gambar yang diizinkan (jpg/png)"})
        return
    }

    // Simpan file
    filePath := "./uploads/avatars/" + userID.(string) + ext
    if err := c.SaveUploadedFile(file, filePath); err != nil {
        c.JSON(500, gin.H{"error": "Gagal simpan gambar"})
        return
    }

    // Update path di database
    if err := h.Repo.DB.Model(&models.Profile{}).Where("user_id = ?", userID).Update("avatar_path", filePath).Error; err != nil {
        c.JSON(500, gin.H{"error": "Gagal update database"})
        return
    }

    c.JSON(200, gin.H{"message": "Avatar berhasil diperbarui"})
}

func (h *ProfileHandler) GetAvatar(c *gin.Context) {
    userID, _ := c.Get("userID")
    
    var profile models.Profile
    if err := h.Repo.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
        c.JSON(404, gin.H{"error": "Profil tidak ditemukan"})
        return
    }

    if profile.AvatarPath == "" {
        // Kirim gambar default jika user belum punya avatar
        c.File("./uploads/avatars/default.jpg")
        return
    }
		c.Header("Cache-Control", "public, max-age=3600")
    c.File(profile.AvatarPath)
}

func (h *ProfileHandler) DeleteAvatar(c *gin.Context) {
	userID, _ := c.Get("userID")

	var profile models.Profile
	if err := h.Repo.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profil tidak ditemukan"})
		return
	}

	if profile.AvatarPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda tidak memiliki avatar untuk dihapus"})
		return
	}
	if err := os.Remove(profile.AvatarPath); err != nil {
		fmt.Printf("Warning: Gagal hapus file fisik: %v\n", err)
	}

	if err := h.Repo.ClearAvatarPath(userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data di database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Avatar berhasil dihapus dan kembali ke default"})
}