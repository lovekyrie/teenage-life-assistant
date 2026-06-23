package excel

import (
	"os"
	"path/filepath"
	"testing"
)

func TestBuildImportTemplateCanBeParsed(t *testing.T) {
	data, err := BuildImportTemplate()
	if err != nil {
		t.Fatalf("BuildImportTemplate() error = %v", err)
	}
	if len(data) == 0 {
		t.Fatal("BuildImportTemplate() returned empty file")
	}

	path := filepath.Join(t.TempDir(), "template.xlsx")
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Fatalf("write template: %v", err)
	}

	result, err := ParseImportFile(path, 1)
	if err != nil {
		t.Fatalf("ParseImportFile() error = %v", err)
	}
	if len(result.Actions) != 5 {
		t.Fatalf("actions count = %d, want 5", len(result.Actions))
	}
	if len(result.Rewards) != 3 {
		t.Fatalf("rewards count = %d, want 3", len(result.Rewards))
	}
	if len(result.Warnings) != 0 {
		t.Fatalf("warnings = %v, want none", result.Warnings)
	}
}
