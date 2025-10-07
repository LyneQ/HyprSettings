package main

import (
	"HyprSettings/internal/core"
	"HyprSettings/internal/core/scanner"

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

func (a *App) GetCoreFiles() []Core.CoreFile {
	hyprlandFiles := Core.HyprlandConfigFiles
	hyprpaperFiles := Core.GetHyprpaperFiles()
	return append(hyprlandFiles, hyprpaperFiles...)
}

func (a *App) GetHyprpaperConfig() (string, error) {
	return Core.GetHyprpaperConfig()
}

func (a *App) GetHyprpaperWallpaper(folder string) ([]scanner.FileType, error) {
	return scanner.ScanForFileTypes(folder, a.ctx)
}

// GetImageContent new method to get single image content on demand
func (a *App) GetImageContent(path string) (string, error) {
	return scanner.GetImageAsBase64(path)
}

// GetImageThumbnail returns a thumbnail version of the image (optimized for gallery display)
func (a *App) GetImageThumbnail(path string) (string, error) {
	return scanner.GetImageThumbnail(path)
}

// ... existing code ...

func (a *App) UpdateHyprpaperWallpaper(newPath string) error {
	return Core.UpdateHyprpaperWallpaper(newPath)
}
