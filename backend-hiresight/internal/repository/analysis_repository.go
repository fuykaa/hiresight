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
// Ambil stats agregat (completed count + highest ats_score + resume_id-nya) milik user tertentu
func (r *AnalysisRepository) GetStatsByUser(userID string) (int64, int, string, error) {
	var agg struct {
		Count    int64
		MaxScore int
	}
	err := r.DB.Table("analysis_results").
		Select("COUNT(analysis_results.id) AS count, COALESCE(MAX(analysis_results.ats_score), 0) AS max_score").
		Joins("JOIN resumes ON resumes.id = analysis_results.resume_id").
		Where("resumes.user_id = ? AND analysis_results.status = ?", userID, "completed").
		Scan(&agg).Error
	if err != nil {
		return 0, 0, "", err
	}

	var topResumeID string
	if agg.Count > 0 {
		var top models.AnalysisResult
		err = r.DB.Table("analysis_results").
			Select("analysis_results.resume_id").
			Joins("JOIN resumes ON resumes.id = analysis_results.resume_id").
			Where("resumes.user_id = ? AND analysis_results.status = ?", userID, "completed").
			Order("analysis_results.ats_score DESC").
			Limit(1).
			Scan(&top).Error
		if err == nil {
			topResumeID = top.ResumeID.String()
		}
	}

	return agg.Count, agg.MaxScore, topResumeID, nil
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