package configutil

import (
	"bufio"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// GetConfigFilePath returns the absolute path to the default Hyprland config file.
func GetConfigFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(homeDir, ".config", "hypr")
	file := filepath.Join(dir, "hyprland.conf")
	if _, err := os.Stat(file); err != nil {
		if os.IsNotExist(err) {
			return "", errors.New("config file does not exist")
		}
		return "", err
	}
	return file, nil
}

// ParseSourcedFiles scans a Hyprland config and returns all file paths referenced by `source` directives.
func ParseSourcedFiles(configPath string) ([]string, error) {
	f, err := os.Open(configPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	homeDir, _ := os.UserHomeDir()
	baseDir := filepath.Dir(configPath)

	// Search for other config files specified in the source directive
	re := regexp.MustCompile(`(?i)^\s*source\s*(?:=\s*)?("[^"]+"|'[^']+'|\S+)`)

	scanner := bufio.NewScanner(f)
	var results []string
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		m := re.FindStringSubmatch(trimmed)
		if len(m) < 2 {
			continue
		}
		p := m[1]
		// Remove surrounding quotes if present
		if len(p) >= 2 {
			if (p[0] == '"' && p[len(p)-1] == '"') || (p[0] == '\'' && p[len(p)-1] == '\'') {
				p = p[1 : len(p)-1]
			}
		}

		if strings.HasPrefix(p, "~/") {
			p = filepath.Join(homeDir, p[2:])
		}

		if !filepath.IsAbs(p) && !strings.HasPrefix(p, "./") && !strings.HasPrefix(p, "../") {
			p = filepath.Join(baseDir, p)
		}

		matches, err := filepath.Glob(p)
		if err != nil || matches == nil {
			results = append(results, filepath.Clean(p))
			continue
		}
		for _, m := range matches {
			results = append(results, filepath.Clean(m))
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return unique(results), nil
}

// unique returns a slice of uniques strings.
func unique(in []string) []string {
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, v := range in {
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}
