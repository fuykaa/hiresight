package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
)

func isAzureConfigured() bool {
	return os.Getenv("AZURE_STORAGE_ACCOUNT_NAME") != "" && os.Getenv("AZURE_STORAGE_ACCOUNT_KEY") != ""
}

func getBlobClient() (*azblob.Client, error) {
	accountName := os.Getenv("AZURE_STORAGE_ACCOUNT_NAME")
	accountKey := os.Getenv("AZURE_STORAGE_ACCOUNT_KEY")

	cred, err := azblob.NewSharedKeyCredential(accountName, accountKey)
	if err != nil {
		return nil, fmt.Errorf("kredensial Azure Storage tidak valid: %w", err)
	}

	serviceURL := "https://" + accountName + ".blob.core.windows.net/"
	client, err := azblob.NewClientWithSharedKeyCredential(serviceURL, cred, nil)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat Azure Blob client: %w", err)
	}

	return client, nil
}

func UploadToBlob(containerName, blobName string, data []byte) error {
	if !isAzureConfigured() {
		dir := filepath.Join("uploads", containerName)
		if err := os.MkdirAll(dir, os.ModePerm); err != nil {
			return err
		}
		return os.WriteFile(filepath.Join(dir, blobName), data, 0644)
	}

	client, err := getBlobClient()
	if err != nil {
		return err
	}
	_, err = client.UploadBuffer(context.Background(), containerName, blobName, data, nil)
	return err
}

func DownloadBlobBytes(containerName, blobName string) ([]byte, error) {
	if !isAzureConfigured() {
		return os.ReadFile(filepath.Join("uploads", containerName, blobName))
	}

	client, err := getBlobClient()
	if err != nil {
		return nil, err
	}

	resp, err := client.DownloadStream(context.Background(), containerName, blobName, nil)
	if err != nil {
		return nil, fmt.Errorf("gagal download dari blob: %w", err)
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func DeleteBlob(containerName, blobName string) error {
	if !isAzureConfigured() {
		return os.Remove(filepath.Join("uploads", containerName, blobName))
	}

	client, err := getBlobClient()
	if err != nil {
		return err
	}
	_, err = client.DeleteBlob(context.Background(), containerName, blobName, nil)
	return err
}
