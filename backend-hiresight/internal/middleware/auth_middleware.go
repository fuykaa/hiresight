package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Ambil token dari cookie
        tokenString, err := c.Cookie("token")
        if err != nil {
            c.JSON(401, gin.H{"error": "Kamu belum login"})
            c.Abort()
            return
        }

        // 2. Parse & Validasi JWT (menggunakan library golang-jwt)
        token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
          secret := os.Getenv("JWT_SECRET")
					return []byte(secret), nil
        })

        if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
            // 3. Simpan user_id ke context agar bisa dipakai di Handler
            c.Set("userID", claims["user_id"])
            c.Next()
        } else {
            c.JSON(401, gin.H{"error": "Token tidak valid"})
            c.Abort()
        }
    }
}

