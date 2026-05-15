package repository

import (
	"backend-hiresight/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

func (r *UserRepository) CreateUserWithProfile(user *models.User, profile *models.Profile) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		profile.UserID = user.ID
		if err := tx.Create(profile).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *UserRepository) EmailExists(email string) bool {
    var count int64
    r.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
    return count > 0
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
    var user models.User
    err := r.DB.Where("email = ?", email).First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (r *UserRepository) FindByUserID(userID string) (*models.User, error) {
	var user models.User
	err := r.DB.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateProfile(userID string, updatedData map[string]interface{}) error {
	return r.DB.Model(&models.Profile{}).Where("user_id = ?", userID).Updates(updatedData).Error
}

func (r * UserRepository) GetProfileByUserID(userID string) (*models.Profile, error) {
	var profile models.Profile
	err := r.DB.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *UserRepository) ClearAvatarPath(userID string) error {
	return r.DB.Model(&models.Profile{}).Where("user_id = ?", userID).Update("avatar_path", "").Error
}