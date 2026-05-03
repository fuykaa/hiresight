package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Email  		string         `gorm:"unique;not null" json:"email"`
	PasswordHash 	string         `gorm:"not null" json:"-"`
	CreatedAt time.Time      `json:"created_at"`}

type Profile struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;unique;not null" json:"user_id"`
	FullName  string    `json:"full_name"`
	Bio       string    `json:"bio"`
	UpdatedAt time.Time `json:"updated_at"`
	AvatarPath string `json:"avatar_path"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.PasswordHash), 10)
    if err != nil {
        return err
    }
    u.PasswordHash = string(hashedPassword)
	u.ID = uuid.New()
	u.CreatedAt = time.Now()
	return
}

func (p *Profile) BeforeCreate(tx *gorm.DB) (err error) {
	p.ID = uuid.New()
	p.UpdatedAt = time.Now()
	return
}