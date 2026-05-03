package repository

import (
	"backend-hiresight/internal/models"

	"gorm.io/gorm"
)

type ResumeRepository struct {
	DB *gorm.DB
}

func (r *ResumeRepository) Create(resume *models.Resume) error {
	return r.DB.Create(resume).Error
}

func (r *ResumeRepository) FindByUserID(userID string) ([]models.Resume, error) {
	var resumes []models.Resume
	err := r.DB.Where("user_id = ?", userID).Order("uploaded_at desc").Find(&resumes).Error
	return resumes, err
}

func (r *ResumeRepository) FindByIDAndUser(resumeID string, userID string) (*models.Resume, error) {
var resume models.Resume
    // Query ini memastikan file yang dicari benar-benar milik user tersebut
    err := r.DB.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error
    if err != nil {
        return nil, err
    }
    return &resume, nil
}

func (r *ResumeRepository) FindAllByUserID(userID string) ([]models.Resume, error) {
	var resumes []models.Resume
	
	// Mencari SEMUA resume yang user_id-nya cocok
	err := r.DB.Where("user_id = ?", userID).Order("uploaded_at desc").Find(&resumes).Error
	
	if err != nil {
		return nil, err
	}
	return resumes, nil
}

func (r *ResumeRepository) Delete(resumeID string, userID string) error {
	return r.DB.Where("id = ? AND user_id = ?", resumeID, userID).Unscoped().Delete(&models.Resume{}).Error
}