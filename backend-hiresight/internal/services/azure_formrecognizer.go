package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type formRecognizerResult struct {
	Status        string `json:"status"`
	AnalyzeResult struct {
		Content string `json:"content"`
	} `json:"analyzeResult"`
}

// ExtractPDFWithFormRecognizer mengirim bytes PDF ke Azure Form Recognizer (prebuilt-read)
// dan mengembalikan teks lengkap dokumen. Mendukung PDF text-based maupun scanned (OCR).
func ExtractPDFWithFormRecognizer(fileBytes []byte) (string, error) {
	endpoint := os.Getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
	key := os.Getenv("AZURE_FORM_RECOGNIZER_KEY")
	if endpoint == "" || key == "" {
		return "", fmt.Errorf("AZURE_FORM_RECOGNIZER_ENDPOINT atau AZURE_FORM_RECOGNIZER_KEY belum dikonfigurasi")
	}

	analyzeURL := strings.TrimRight(endpoint, "/") + "/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30"

	req, err := http.NewRequest("POST", analyzeURL, bytes.NewReader(fileBytes))
	if err != nil {
		return "", fmt.Errorf("gagal membuat request Form Recognizer: %w", err)
	}
	req.Header.Set("Ocp-Apim-Subscription-Key", key)
	req.Header.Set("Content-Type", "application/octet-stream")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal mengirim ke Form Recognizer: %w", err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return "", fmt.Errorf("Form Recognizer menolak request: status %d", resp.StatusCode)
	}

	operationURL := resp.Header.Get("Operation-Location")
	if operationURL == "" {
		return "", fmt.Errorf("Operation-Location header tidak ditemukan di response Form Recognizer")
	}

	// Poll hingga analisis selesai (max ~60 detik)
	for i := 0; i < 30; i++ {
		time.Sleep(2 * time.Second)

		pollReq, err := http.NewRequest("GET", operationURL, nil)
		if err != nil {
			return "", err
		}
		pollReq.Header.Set("Ocp-Apim-Subscription-Key", key)

		pollResp, err := client.Do(pollReq)
		if err != nil {
			return "", fmt.Errorf("gagal polling Form Recognizer: %w", err)
		}

		body, _ := io.ReadAll(pollResp.Body)
		pollResp.Body.Close()

		var result formRecognizerResult
		if err := json.Unmarshal(body, &result); err != nil {
			return "", fmt.Errorf("gagal parse response Form Recognizer: %w", err)
		}

		switch result.Status {
		case "succeeded":
			return result.AnalyzeResult.Content, nil
		case "failed":
			return "", fmt.Errorf("Form Recognizer gagal memproses dokumen")
		}
	}

	return "", fmt.Errorf("Form Recognizer timeout setelah 60 detik")
}
