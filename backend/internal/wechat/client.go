package wechat

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type SessionResult struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	UnionID    string `json:"unionid"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

type Client struct {
	AppID     string
	AppSecret string
	MockMode  bool
	http      *http.Client
}

func NewClient(appID, appSecret string, mockMode bool) *Client {
	return &Client{
		AppID:     appID,
		AppSecret: appSecret,
		MockMode:  mockMode,
		http:      &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *Client) Code2Session(code string) (*SessionResult, error) {
	if c.MockMode {
		return &SessionResult{OpenID: "mock_" + code, SessionKey: "mock_session"}, nil
	}
	url := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		c.AppID, c.AppSecret, code,
	)
	resp, err := c.http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result SessionResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.ErrCode != 0 {
		return nil, fmt.Errorf("wechat error: %d %s", result.ErrCode, result.ErrMsg)
	}
	return &result, nil
}
