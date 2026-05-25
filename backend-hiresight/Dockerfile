# Binary dikompile di luar (cross-compile dari laptop) untuk menghindari OOM di VM kecil
FROM alpine:latest
RUN apk add --no-cache tzdata ca-certificates
WORKDIR /app
COPY server .
RUN chmod +x server && mkdir -p uploads/resumes
EXPOSE 8081
CMD ["./server"]
