package Core

import (
	"context"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var logCtx context.Context

// Init stores the application context so core can use Wails runtime logging.
func Init(ctx context.Context) {
	logCtx = ctx
}

// GetHyprlandEntrypoint retrieves the Hyprland configuration entrypoint based on environment variables.
func GetHyprlandEntrypoint() string {
	homeDir := os.Getenv("HOME")
	runtime.LogDebugf(logCtx, "HOME value: '%s'", homeDir)

	configFile, err := os.Open(homeDir + "/.config/hypr/hyprland.conf")
	if err != nil {
		runtime.LogFatalf(logCtx, "Error opening config file: %s. The app cannot run without a Hyprland config file", err.Error())
	}

	defer configFile.Close()

	runtime.LogInfof(logCtx, "Hyprland entry file found in %v", configFile.Name())
	return configFile.Name()
}
