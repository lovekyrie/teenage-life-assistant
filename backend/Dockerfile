FROM golang:1.22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o app ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/app .
COPY config/.env.example config/.env.example

RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 8080
CMD ["./app"]
