package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/duanyupeng/teenage-life-assistant/internal/api"
	"github.com/duanyupeng/teenage-life-assistant/internal/config"
	"github.com/duanyupeng/teenage-life-assistant/internal/database"
	"github.com/duanyupeng/teenage-life-assistant/internal/repository"
	"github.com/duanyupeng/teenage-life-assistant/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.Connect(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}

	repo := repository.New(db)
	svc := service.New(repo, cfg)
	r := api.SetupRouter(cfg, svc)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("server listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}
