package repository

import (
	"backend-hiresight/internal/models"

	"gorm.io/gorm"
)

type AnalysisRepository struct {
	DB *gorm.DB
}

// Create atau Update hasil analisis
func (r *AnalysisRepository) Save(analysis *models.AnalysisResult) error {
	return r.DB.Save(analysis).Error
}
// Ambil hasil berdasarkan Resume ID
func (r *AnalysisRepository) GetResultWithSecurity(resumeID string, userID string) (*models.AnalysisResult, error) {
	var result models.AnalysisResult
	err := r.DB.Table("analysis_results").
		Select("analysis_results.*").
		Joins("JOIN resumes ON resumes.id = analysis_results.resume_id").
		Where("analysis_results.resume_id = ? AND resumes.user_id = ?", resumeID, userID).
		First(&result).Error

	return &result, err
}