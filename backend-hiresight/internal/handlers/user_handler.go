package handlers

import (
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	Repo *repository.UserRepository
}

func (h *UserHandler) Register(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
		FullName string `json:"full_name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Email:        input.Email,
		PasswordHash: input.Password, 
	}
	profile := models.Profile{
		FullName: input.FullName,
	}

	if h.Repo.EmailExists(input.Email) {
    c.JSON(http.StatusConflict, gin.H{"error": "Email ini sudah terdaftar"})
    return
}

	if err := h.Repo.CreateUserWithProfile(&user, &profile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Akun dan profil berhasil dibuat!"})
}


func (h *UserHandler) Login(c *gin.Context) {
    // A. Ambil input dari request body
    var input struct {
        Email    string `json:"email" binding:"required,email"`
        PasswordHash string `json:"password" binding:"required"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Format input tidak valid"})
        return
    }

    // B. Cari user berdasarkan email
    user, err := h.Repo.FindByEmail(input.Email)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
        return
    }

    // C. Verifikasi Password menggunakan bcrypt
    err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.PasswordHash))
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
        return
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": user.ID,
        "exp":     time.Now().Add(time.Hour * 24).Unix(),
    })
		secret := os.Getenv("JWT_SECRET")
    tokenString, _ := token.SignedString([]byte(secret))

    // Set Cookie
    c.SetCookie("token", tokenString, 3600*24, "/", "", false, true)

    c.JSON(http.StatusOK, gin.H{"message": "Login berhasil"})
}

func (h *UserHandler) Logout(c *gin.Context) {
		// Hapus cookie dengan mengatur MaxAge negatif
		c.SetCookie("token", "", -1, "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
}