package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Resume struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	FileName       string    `gorm:"type:varchar(255)" json:"file_name"`
	FilePath       string    `gorm:"type:text" json:"file_path"`
	FileType       string    `gorm:"type:varchar(10)" json:"file_type"`
	JobPosition    string    `gorm:"type:text" json:"job_position"`
	JobDescription string    `gorm:"type:text" json:"job_description"`
	UploadedAt     time.Time `json:"uploaded_at"`
}

func (r *Resume) BeforeCreate(tx *gorm.DB) (err error) {
	r.ID = uuid.New()
	r.UploadedAt = time.Now()
	return
}