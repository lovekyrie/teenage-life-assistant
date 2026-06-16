package middleware

import (
	"fmt"
	"strings"
	"time"

	"github.com/duanyupeng/teenage-life-assistant/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserIDKey   = "userID"
	ContextFamilyIDKey = "familyID"
	ContextOpenIDKey   = "openid"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	OpenID string `json:"openid"`
	jwt.RegisteredClaims
}

type FamilyLookup func(userID uint) (*uint, error)

var allowedOrigins = map[string]bool{
	"http://localhost":      true,
	"http://localhost:8080": true,
	"http://127.0.0.1":      true,
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" || allowedOrigins[origin] || strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:") {
			if origin != "" {
				c.Header("Access-Control-Allow-Origin", origin)
			}
		}
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func JWTAuth(secret string, lookup FamilyLookup) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			response.Unauthorized(c, "未登录")
			c.Abort()
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err != nil || !token.Valid {
			response.Unauthorized(c, "登录已失效")
			c.Abort()
			return
		}
		familyID, err := lookup(claims.UserID)
		if err != nil {
			response.Unauthorized(c, "登录已失效")
			c.Abort()
			return
		}
		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextFamilyIDKey, familyID)
		c.Set(ContextOpenIDKey, claims.OpenID)
		c.Next()
	}
}

func RequireFamily() gin.HandlerFunc {
	return func(c *gin.Context) {
		v, ok := c.Get(ContextFamilyIDKey)
		if !ok || v == nil {
			response.Forbidden(c, "请先加入家庭")
			c.Abort()
			return
		}
		familyID, ok := v.(*uint)
		if !ok || familyID == nil || *familyID == 0 {
			response.Forbidden(c, "请先加入家庭")
			c.Abort()
			return
		}
		c.Next()
	}
}

func GetUserID(c *gin.Context) uint {
	v, _ := c.Get(ContextUserIDKey)
	id, _ := v.(uint)
	return id
}

func GetFamilyID(c *gin.Context) uint {
	v, _ := c.Get(ContextFamilyIDKey)
	if v == nil {
		return 0
	}
	id, _ := v.(*uint)
	if id == nil {
		return 0
	}
	return *id
}

func SignToken(secret string, userID uint, openid string) (string, error) {
	claims := Claims{
		UserID: userID,
		OpenID: openid,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
