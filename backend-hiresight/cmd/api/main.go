package main

import (
	"backend-hiresight/internal/config"
	"backend-hiresight/internal/handlers"
	"backend-hiresight/internal/middleware"
	"backend-hiresight/internal/models"
	"backend-hiresight/internal/repository"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Pastikan folder uploads ada sebelum server start
	if err := os.MkdirAll("uploads/resumes", os.ModePerm); err != nil {
		log.Fatal("Gagal membuat folder uploads:", err)
	}

	// 2. Load Config & Koneksi Database
	cfg := config.LoadConfig()
	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal koneksi ke database:", err)
	}

	// 3. Auto Migration (Membuat tabel otomatis berdasarkan Struct)
	db.AutoMigrate(&models.User{}, &models.Profile{}, &models.Resume{}, &models.AnalysisResult{})

	// 4. Inisialisasi Repository & Handler
	userRepo := &repository.UserRepository{DB: db}
	resumeRepo := &repository.ResumeRepository{DB: db}
	analysisRepo := &repository.AnalysisRepository{DB: db}

	userHandler := &handlers.UserHandler{Repo: userRepo}
	profileHandler := &handlers.ProfileHandler{Repo: userRepo}
	resumeHandler := &handlers.ResumeHandler{Repo: resumeRepo}
	analysisHandler := &handlers.AnalysisHandler{Repo: analysisRepo, ResumeRepo: resumeRepo}

	// 5. Setup Router Gin
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.CORSOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.POST("/register", userHandler.Register)
	r.POST("/login", userHandler.Login)

	authorized := r.Group("/api")
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.PUT("/profile", profileHandler.UpdateProfile)
		authorized.GET("/profile", profileHandler.GetMyProfile)
		authorized.PUT("/profile/avatar", profileHandler.UploadAvatar)
		authorized.GET("/profile/avatar", profileHandler.GetAvatar)
		authorized.DELETE("/profile/avatar", profileHandler.DeleteAvatar)
		authorized.POST("/logout", userHandler.Logout)
		authorized.POST("/resume/upload", resumeHandler.UploadResume)
		authorized.GET("/resume/:id", resumeHandler.GetResumeByID)
		authorized.GET("/resume/preview/:id", resumeHandler.PreviewResume)
		authorized.GET("/resumes", resumeHandler.GetAllResumes)
		authorized.DELETE("/resume/:id", resumeHandler.DeleteResume)
		authorized.GET("/analysis/stats", analysisHandler.GetStats)
		authorized.POST("/analysis/:resume_id", analysisHandler.TriggerAnalysis)
		authorized.GET("/analysis/:resume_id", analysisHandler.GetResult)
	}

	log.Println("Server berjalan di port 8081...")
	r.Run(":8081")
}
