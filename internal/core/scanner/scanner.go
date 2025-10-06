package scanner

import (
	"context"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//======================================================================================================================
// Type definitions
//======================================================================================================================

type FileType struct {
	Name    string
	Path    string
	Ext     string
	Mime    string
	Size    int64
	Content []byte
}

//======================================================================================================================
// Public function
//======================================================================================================================

func ScanForFileTypes(path string, logCtx context.Context) ([]FileType, error) {
	expandedPath := expandPath(path)
	runtime.LogInfof(logCtx, "Scanning recursively in %v (expanded: %v)", path, expandedPath)

	imageExtensions := map[string]bool{
		".png":  true,
		".jpg":  true,
		".jpeg": true,
		".gif":  true,
		".bmp":  true,
		".webp": true,
		".tiff": true,
		".svg":  true,
	}

	var fileTypes []FileType

	err := filepath.WalkDir(expandedPath, func(filePath string, d os.DirEntry, err error) error {
		if err != nil {
			runtime.LogDebugf(logCtx, "Error accessing %v: %v (skipping)", filePath, err)
			return nil
		}

		// Skip hidden directories
		if d.IsDir() && filePath != expandedPath {
			name := d.Name()
			if strings.HasPrefix(name, ".") {
				runtime.LogDebugf(logCtx, "Skipping hidden directory: %v", filePath)
				return filepath.SkipDir
			}
			return nil
		}

		if d.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(filePath))
		if !imageExtensions[ext] {
			return nil
		}

		runtime.LogDebugf(logCtx, "Processing file: %v", filePath)
		fileType, err := createFileTypeFromPath(filePath)
		if err != nil {
			runtime.LogErrorf(logCtx, "Error processing file %v: %v (skipping)", filePath, err)
			return nil
		}

		runtime.LogDebugf(logCtx, "Found file: %v", fileType.Path)
		fileTypes = append(fileTypes, fileType)
		return nil
	})

	if err != nil {
		runtime.LogErrorf(logCtx, "Error during directory traversal: %v", err)
		return nil, err
	}

	runtime.LogInfof(logCtx, "Found %v image files recursively", len(fileTypes))
	return fileTypes, nil
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

func createFileTypeFromPath(filePath string) (FileType, error) {
	fileStat, err := os.Stat(filePath)
	if err != nil {
		return FileType{}, err
	}

	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		return FileType{}, err
	}

	ext := filepath.Ext(filePath)
	return FileType{
		Name:    fileStat.Name(),
		Path:    filePath,
		Ext:     ext,
		Mime:    mime.TypeByExtension(ext),
		Size:    fileStat.Size(),
		Content: fileContent,
	}, nil
}
