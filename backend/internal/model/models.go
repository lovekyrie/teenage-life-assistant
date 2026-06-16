package model

import "time"

type Family struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:100;not null" json:"name"`
	InviteCode string    `gorm:"size:6;uniqueIndex;not null" json:"invite_code"`
	CreatedAt  time.Time `json:"created_at"`
}

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FamilyID  *uint     `gorm:"index" json:"family_id"`
	OpenID    string    `gorm:"column:openid;size:64;uniqueIndex;not null" json:"openid"`
	Nickname  string    `gorm:"size:100" json:"nickname"`
	Avatar    string    `gorm:"size:500" json:"avatar"`
	Role      string    `gorm:"size:20;default:member" json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Kid struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FamilyID  uint      `gorm:"index;not null" json:"family_id"`
	Name      string    `gorm:"size:50;not null" json:"name"`
	Gender    string    `gorm:"size:10" json:"gender"`
	Birthday  *time.Time `json:"birthday"`
	Avatar    string    `gorm:"size:500" json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
}

type PointAction struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	FamilyID    uint   `gorm:"index;not null" json:"family_id"`
	Type        string `gorm:"size:20;not null" json:"type"`
	Category    string `gorm:"size:50" json:"category"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Points      int    `gorm:"not null" json:"points"`
	Description string `gorm:"size:500" json:"description"`
	DailyLimit  *int   `json:"daily_limit"`
	SortOrder   int    `gorm:"default:0" json:"sort_order"`
	Enabled     bool   `gorm:"default:true" json:"enabled"`
}

type PointRecord struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	FamilyID       uint      `gorm:"index;not null" json:"family_id"`
	KidID          uint      `gorm:"index;not null" json:"kid_id"`
	ActionID       *uint     `json:"action_id"`
	Type           string    `gorm:"size:20;not null" json:"type"`
	Points         int       `gorm:"not null" json:"points"`
	OperatorUserID uint      `gorm:"not null" json:"operator_user_id"`
	Note           string    `gorm:"size:500" json:"note"`
	CreatedAt      time.Time `gorm:"index" json:"created_at"`
	Action         *PointAction `gorm:"foreignKey:ActionID" json:"action,omitempty"`
	Kid            *Kid         `gorm:"foreignKey:KidID" json:"kid,omitempty"`
}

type Reward struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	FamilyID    uint   `gorm:"index;not null" json:"family_id"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Description string `gorm:"size:500" json:"description"`
	ImageURL    string `gorm:"size:500" json:"image_url"`
	PointsCost  int    `gorm:"not null" json:"points_cost"`
	Stock       int    `gorm:"default:-1" json:"stock"`
	Enabled     bool   `gorm:"default:true" json:"enabled"`
}

type Redemption struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	FamilyID       uint       `gorm:"index;not null" json:"family_id"`
	KidID          uint       `gorm:"index;not null" json:"kid_id"`
	RewardID       uint       `gorm:"index;not null" json:"reward_id"`
	PointsCost     int        `gorm:"not null" json:"points_cost"`
	Status         string     `gorm:"size:20;default:pending" json:"status"`
	OperatorUserID uint       `gorm:"not null" json:"operator_user_id"`
	FulfilledAt    *time.Time `json:"fulfilled_at"`
	CreatedAt      time.Time  `json:"created_at"`
	Reward         *Reward    `gorm:"foreignKey:RewardID" json:"reward,omitempty"`
	Kid            *Kid       `gorm:"foreignKey:KidID" json:"kid,omitempty"`
}
