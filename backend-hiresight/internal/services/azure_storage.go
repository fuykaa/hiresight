package services

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
)

func getBlobClient() (*azblob.Client, error) {
	accountName := os.Getenv("AZURE_STORAGE_ACCOUNT_NAME")
	accountKey := os.Getenv("AZURE_STORAGE_ACCOUNT_KEY")
	if accountName == "" || accountKey == "" {
		return nil, fmt.Errorf("AZURE_STORAGE_ACCOUNT_NAME atau AZURE_STORAGE_ACCOUNT_KEY belum dikonfigurasi")
	}

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
	client, err := getBlobClient()
	if err != nil {
		return err
	}
	_, err = client.UploadBuffer(context.Background(), containerName, blobName, data, nil)
	return err
}

func DownloadBlobBytes(containerName, blobName string) ([]byte, error) {
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
	client, err := getBlobClient()
	if err != nil {
		return err
	}
	_, err = client.DeleteBlob(context.Background(), containerName, blobName, nil)
	return err
}
