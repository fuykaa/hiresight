# Stage 1: Build binary
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/api/main.go

# Stage 2: Runtime image minimal
FROM alpine:latest
RUN apk add --no-cache tzdata
WORKDIR /app
COPY --from=builder /app/server .
RUN mkdir -p uploads/resumes
EXPOSE 8081
CMD ["./server"]
