package scanner

import (
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"image/jpeg"
	"image/png"
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
	Content string
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

func GetImageAsBase64(filePath string) (string, error) {
	fileBytes, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(fileBytes), nil
}

// GetImageThumbnail generates a thumbnail version of the image (max 300px on longest side)
func GetImageThumbnail(filePath string) (string, error) {
	// Read the image file
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	// Decode the image
	img, format, err := image.Decode(file)
	if err != nil {
		return "", err
	}

	// Get original dimensions
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	maxSize := 1000
	var newWidth, newHeight int

	if width > height {
		if width > maxSize {
			newWidth = maxSize
			newHeight = (height * maxSize) / width
		} else {
			newWidth = width
			newHeight = height
		}
	} else {
		if height > maxSize {
			newHeight = maxSize
			newWidth = (width * maxSize) / height
		} else {
			newWidth = width
			newHeight = height
		}
	}

	// Create thumbnail using the nearest neighbor
	thumbnail := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))

	// Simple downscaling
	for y := 0; y < newHeight; y++ {
		for x := 0; x < newWidth; x++ {
			srcX := (x * width) / newWidth
			srcY := (y * height) / newHeight
			thumbnail.Set(x, y, img.At(srcX, srcY))
		}
	}

	// Encode to buffer with compression
	var buf bytes.Buffer
	switch format {
	case "jpeg", "jpg":
		err = jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: 75})
	case "png":
		err = png.Encode(&buf, thumbnail)
	default:
		err = jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: 75})
	}

	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

//======================================================================================================================
// Private function
//======================================================================================================================

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

	ext := filepath.Ext(filePath)
	return FileType{
		Name:    fileStat.Name(),
		Path:    filePath,
		Ext:     ext,
		Mime:    mime.TypeByExtension(ext),
		Size:    fileStat.Size(),
		Content: "", // Don't load content by default - use GetImageContent for on-demand loading
	}, nil
}
