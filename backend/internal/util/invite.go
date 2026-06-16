package util

import (
	"crypto/rand"
	"math/big"
)

const inviteChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func GenerateInviteCode(length int) (string, error) {
	result := make([]byte, length)
	max := big.NewInt(int64(len(inviteChars)))
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		result[i] = inviteChars[n.Int64()]
	}
	return string(result), nil
}
