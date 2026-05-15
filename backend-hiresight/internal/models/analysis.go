package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes" // Import ini untuk handle JSONB
)

type AnalysisResult struct {
    ID               uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
    ResumeID         uuid.UUID      `gorm:"type:uuid;not null" json:"resume_id"`
    OverallScore     int            `json:"overall_score"`
    ATSScore         int            `json:"ats_score"`
    KeywordScore     int            `json:"keyword_score"`
    FormatScore      int            `json:"format_score"`
    KeywordAnalysis  datatypes.JSON `json:"keyword_analysis"` // Handle JSONB PostgreSQL
    FeedbackFormat   string         `json:"feedback_format"`
    FeedbackContent  string         `json:"feedback_content"`
    FeedbackKeywords string         `json:"feedback_keywords"`
    Status           string         `gorm:"type:varchar(20);default:'pending'" json:"status"`
    CandidateProfile string         `gorm:"type:varchar(20)" json:"candidate_profile"` // nilai valid: experienced, fresh_graduate, career_changer
    CreatedAt        time.Time      `json:"created_at"`
}