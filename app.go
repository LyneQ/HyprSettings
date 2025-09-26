package main

import (
	"HyprSettings/internal/configutil"
	"context"
	"os"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetConfigFilesPath() string {
	ConfigFilePath, err := configutil.GetConfigFilePath()
	if err != nil {
		panic(err)
	}

	_, err = configutil.ParseSourcedFiles(ConfigFilePath)
	if err != nil {
		panic(err)
	}

	return ConfigFilePath
}

// GetSourcedFilePaths returns an array of file paths referenced by `source` directives in the Hyprland config.
func (a *App) GetSourcedFilePaths() []string {
	configPath, err := configutil.GetConfigFilePath()
	if err != nil {
		panic(err)
	}
	paths, err := configutil.ParseSourcedFiles(configPath)
	if err != nil {
		panic(err)
	}
	return paths
}

// GetFileContent returns the content of the given file path as a string.
func (a *App) GetFileContent(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return string(b)
}

// SaveFile writes the given content to the specified path.
func (a *App) SaveFile(path string, content string) bool {
	// 0600 so only the user can read/write the file
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		panic(err)
	}
	return true
}
