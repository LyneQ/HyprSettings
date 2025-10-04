package main

import (
	"HyprSettings/internal/core"

	"github.com/wailsapp/wails/v2/pkg/logger"

	"context"
)

//======================================================================================================================
// Type definitions
//======================================================================================================================

type App struct {
	ctx    context.Context
	logger logger.Logger
}

//======================================================================================================================
// Public functions
//======================================================================================================================

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

//======================================================================================================================
// Private functions
//======================================================================================================================

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	Core.Init(ctx)
	_ = Core.GetHyprlandFiles()
}
