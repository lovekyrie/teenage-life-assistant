package api

import (
	"github.com/duanyupeng/teenage-life-assistant/internal/config"
	"github.com/duanyupeng/teenage-life-assistant/internal/middleware"
	"github.com/duanyupeng/teenage-life-assistant/internal/service"
	"github.com/gin-gonic/gin"
)

func SetupRouter(cfg *config.Config, svc *service.Service) *gin.Engine {
	gin.SetMode(cfg.GinMode)
	r := gin.Default()
	r.Use(middleware.CORS())

	h := NewHandler(svc)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.POST("/auth/login", h.Login)

		auth := api.Group("")
		auth.Use(middleware.JWTAuth(cfg.JWTSecret, svc.LookupUserFamily))
		{
			auth.POST("/families", h.CreateFamily)
			auth.POST("/families/join", h.JoinFamily)

			family := auth.Group("")
			family.Use(middleware.RequireFamily())
			{
				family.GET("/families/me", h.GetFamilyMe)
				family.GET("/kids", h.ListKids)
				family.POST("/kids", h.CreateKid)
				family.GET("/kids/:id/points", h.GetKidPoints)

				family.GET("/point-actions", h.ListPointActions)
				family.POST("/point-actions", h.CreatePointAction)
				family.PUT("/point-actions/:id", h.UpdatePointAction)
				family.DELETE("/point-actions/:id", h.DeletePointAction)
				family.POST("/point-actions/import", h.ImportPointActions)

				family.POST("/point-records", h.CreatePointRecord)
				family.GET("/point-records", h.ListPointRecords)
				family.GET("/point-records/summary", h.PointSummary)
				family.DELETE("/point-records/:id", h.RevokePointRecord)

				family.GET("/rewards", h.ListRewards)
				family.POST("/rewards", h.CreateReward)
				family.PUT("/rewards/:id", h.UpdateReward)
				family.DELETE("/rewards/:id", h.DeleteReward)

				family.POST("/redemptions", h.CreateRedemption)
				family.GET("/redemptions", h.ListRedemptions)
				family.PUT("/redemptions/:id/fulfill", h.FulfillRedemption)
				family.PUT("/redemptions/:id/cancel", h.CancelRedemption)
			}
		}
	}
	return r
}
