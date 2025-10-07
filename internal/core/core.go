package Core

import (
	//"HyprSettings/internal/core/scanner"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//======================================================================================================================
// Type definitions
//======================================================================================================================

type CoreFile struct {
	Path       string
	Name       string
	Size       int64
	Permission os.FileMode
	content    []byte
}

//======================================================================================================================
// Shared variables
//======================================================================================================================

var logCtx context.Context

// defaultHyprlandConfigDir is the default location of the Hyprland config file.
var defaultHyprlandConfigDir = os.Getenv("HOME") + "/" + ".config/hypr/"

// HyprlandConfigFiles is a list of CoreFile objects that represent the Hyprland configuration files.
var HyprlandConfigFiles []CoreFile

//======================================================================================================================
// Public functions
//======================================================================================================================

// Init stores the application context so core can use Wails runtime logging.
func Init(ctx context.Context) {
	logCtx = ctx
}

// GetHyprlandFiles GetHyprlandEntrypoint retrieves the Hyprland configuration entrypoint based on environment variables.
func GetHyprlandFiles() []CoreFile {

	runtime.LogDebugf(logCtx, "HOME value: '%s'", defaultHyprlandConfigDir)

	configFile, err := os.Open(defaultHyprlandConfigDir + "hyprland.conf")
	if err != nil {
		runtime.LogFatalf(logCtx, "Error opening config file: %s. The app cannot run without a Hyprland config file", err.Error())
	}

	defer configFile.Close()

	runtime.LogInfof(logCtx, "Hyprland entry file found in %v", configFile.Name())

	// content of the entry file
	configFileContent, err := os.ReadFile(configFile.Name())
	if err != nil {
		runtime.LogFatalf(logCtx, "Error reading config file: %s. The app cannot run without a Hyprland config file", err.Error())
	}

	coreFiles := make([]CoreFile, 0)
	for _, path := range scanForSources(string(configFileContent)) {
		expandedPath := expandPath(path)
		coreFiles = append(coreFiles, GetCoreFileFromPath(expandedPath))
	}

	runtime.LogInfof(logCtx, "Found %v sources", len(coreFiles))
	runtime.LogInfof(logCtx, "Sources")
	for _, coreFile := range coreFiles {
		runtime.LogInfof(logCtx, "  %v (%v bytes)", coreFile.Name, coreFile.Size)
	}

	HyprlandConfigFiles = coreFiles
	return coreFiles
}

// GetHyprpaperFiles retrieves the Hyprpaper configuration file.
func GetHyprpaperFiles() []CoreFile {

	runtime.LogDebugf(logCtx, "Looking for hyprpaper.conf in: '%s'", defaultHyprlandConfigDir)

	configFile, err := os.Open(defaultHyprlandConfigDir + "hyprpaper.conf")
	if err != nil {
		runtime.LogErrorf(logCtx, "Error opening hyprpaper config file: %s", err.Error())
		return []CoreFile{}
	}

	defer configFile.Close()

	runtime.LogInfof(logCtx, "Hyprpaper config file found in %v", configFile.Name())

	// Get the file info and content
	coreFile := GetCoreFileFromPath(configFile.Name())

	runtime.LogInfof(logCtx, "Loaded hyprpaper.conf (%v bytes)", coreFile.Size)

	return []CoreFile{coreFile}
}

// GetHyprpaperConfig reads and returns the content of hyprpaper.conf
func GetHyprpaperConfig() (string, error) {
	configPath := defaultHyprlandConfigDir + "hyprpaper.conf"
	content, err := os.ReadFile(configPath)
	if err != nil {
		runtime.LogErrorf(logCtx, "Error reading hyprpaper config: %s", err.Error())
		return "", err
	}
	return string(content), nil
}

// UpdateHyprpaperWallpaper updates all wallpaper paths in hyprpaper.conf and restarts hyprpaper
func UpdateHyprpaperWallpaper(newPath string) error {
	configPath := defaultHyprlandConfigDir + "hyprpaper.conf"

	content, err := os.ReadFile(configPath)
	if err != nil {
		runtime.LogErrorf(logCtx, "Error reading hyprpaper config: %s", err.Error())
		return err
	}

	expandedNewPath := expandPath(newPath)

	lines := strings.Split(string(content), "\n")
	var updatedLines []string

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		if strings.HasPrefix(trimmedLine, "preload") {
			updatedLines = append(updatedLines, "preload = "+newPath)
		} else if strings.HasPrefix(trimmedLine, "wallpaper") {

			parts := strings.SplitN(trimmedLine, ",", 2)
			if len(parts) == 2 {
				monitorPart := strings.TrimSpace(strings.TrimPrefix(parts[0], "wallpaper"))
				monitorPart = strings.TrimPrefix(monitorPart, "=")
				monitorPart = strings.TrimSpace(monitorPart)
				updatedLines = append(updatedLines, "wallpaper = "+monitorPart+", "+newPath)
			} else {
				updatedLines = append(updatedLines, line)
			}
		} else {
			updatedLines = append(updatedLines, line)
		}
	}

	newContent := strings.Join(updatedLines, "\n")
	err = os.WriteFile(configPath, []byte(newContent), 0644)
	if err != nil {
		runtime.LogErrorf(logCtx, "Error writing hyprpaper config: %s", err.Error())
		return err
	}

	runtime.LogInfof(logCtx, "Updated hyprpaper.conf with new wallpaper path: %s (expanded: %s)", newPath, expandedNewPath)

	runtime.LogInfof(logCtx, "Restarting hyprpaper service to apply wallpaper changes...")
	// Use systemctl to restart hyprpaper.service
	restartCmd := exec.Command("systemctl", "--user", "restart", "hyprpaper.service")
	if err := restartCmd.Run(); err != nil {
		runtime.LogErrorf(logCtx, "Error restarting hyprpaper service: %s", err.Error())
		return err
	}

	runtime.LogInfof(logCtx, "Hyprpaper service restarted successfully")
	return nil
}

// GetCoreFileFromPath retrieves a CoreFile from a given path.
func GetCoreFileFromPath(path string) CoreFile {
	fileInfo, err := os.Stat(path)
	if err != nil {
		runtime.LogErrorf(logCtx, "Error getting file info: %s", err.Error())
		return CoreFile{}
	}

	content, err := os.ReadFile(path)
	if err != nil {
		runtime.LogErrorf(logCtx, "Error reading file: %s", err.Error())
		return CoreFile{}
	}

	return CoreFile{
		Path:       path,
		Name:       fileInfo.Name(),
		Size:       fileInfo.Size(),
		Permission: fileInfo.Mode(),
		content:    content,
	}
}

//======================================================================================================================
// Private functions
//======================================================================================================================

// scanForSources scans for source directive and returns a list of sources.
func scanForSources(content string) []string {
	sourcesRegex := `(source)\s*(=)\s*([^#\n]*)`

	var sources []string
	re := regexp.MustCompile(sourcesRegex)
	matches := re.FindAllStringSubmatch(content, -1)

	for _, match := range matches {
		if len(match) >= 4 {
			sources = append(sources, match[3])
		}
	}

	return sources
}

// expandPath expands ~ to the home directory and resolves the full path
func expandPath(path string) string {
	path = strings.TrimSpace(path)

	if strings.HasPrefix(path, "~/") {
		home := os.Getenv("HOME")
		path = filepath.Join(home, path[2:])
	}

	return filepath.Clean(path)
}
