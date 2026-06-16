package config

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	GinMode         string
	JWTSecret       string
	DBPath          string
	WechatAppID     string
	WechatAppSecret string
	DevMockWechat   bool
}

func Load() (*Config, error) {
	_ = godotenv.Load("config/.env")
	_ = godotenv.Load(".env")

	dbPath := getEnv("DB_PATH", "./data/data.db")
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, err
	}

	mode := getEnv("GIN_MODE", "debug")
	secret := getEnv("JWT_SECRET", "")
	if secret == "" || (mode == "release" && (secret == "dev-secret" || secret == "change-me-in-production")) {
		return nil, errors.New("JWT_SECRET 未设置或为默认值，生产环境必须改为强随机字符串")
	}
	if secret == "" {
		secret = "dev-secret"
	}

	return &Config{
		Port:            getEnv("PORT", "8080"),
		GinMode:         mode,
		JWTSecret:       secret,
		DBPath:          dbPath,
		WechatAppID:     getEnv("WECHAT_APP_ID", ""),
		WechatAppSecret: getEnv("WECHAT_APP_SECRET", ""),
		DevMockWechat:   getEnv("DEV_MOCK_WECHAT", "false") == "true",
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
