package database

import (
	"github.com/duanyupeng/teenage-life-assistant/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dbPath string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(
		&model.Family{},
		&model.User{},
		&model.Kid{},
		&model.PointAction{},
		&model.PointRecord{},
		&model.Reward{},
		&model.Redemption{},
	); err != nil {
		return nil, err
	}
	return db, nil
}
