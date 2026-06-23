package api

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/duanyupeng/teenage-life-assistant/internal/excel"
	"github.com/duanyupeng/teenage-life-assistant/internal/middleware"
	"github.com/duanyupeng/teenage-life-assistant/internal/model"
	"github.com/duanyupeng/teenage-life-assistant/internal/response"
	"github.com/duanyupeng/teenage-life-assistant/internal/service"
	"github.com/gin-gonic/gin"
)

const (
	maxExcelUploadBytes = 5 * 1024 * 1024
)

var allowedExcelExts = map[string]bool{".xlsx": true, ".xls": true}

type Handler struct {
	svc *service.Service
}

func NewHandler(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func parseID(s string) (uint, error) {
	n, err := strconv.ParseUint(strings.TrimSpace(s), 10, 32)
	if err != nil || n == 0 {
		return 0, err
	}
	return uint(n), nil
}

func uriID(c *gin.Context) (uint, bool) {
	id, err := parseID(c.Param("id"))
	if err != nil || id == 0 {
		response.BadRequest(c, "参数错误")
		return 0, false
	}
	return id, true
}

func queryKidID(c *gin.Context) *uint {
	v := strings.TrimSpace(c.Query("kid_id"))
	if v == "" {
		return nil
	}
	id, err := parseID(v)
	if err != nil || id == 0 {
		return nil
	}
	return &id
}

func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	result, err := h.svc.Login(req.Code)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, result)
}

func (h *Handler) CreateFamily(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	family, user, err := h.svc.CreateFamily(middleware.GetUserID(c), req.Name)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, gin.H{"family": family, "user": user})
}

func (h *Handler) JoinFamily(c *gin.Context) {
	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	family, user, err := h.svc.JoinFamily(middleware.GetUserID(c), strings.ToUpper(strings.TrimSpace(req.InviteCode)))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, gin.H{"family": family, "user": user})
}

func (h *Handler) GetFamilyMe(c *gin.Context) {
	data, err := h.svc.GetFamilyMe(middleware.GetFamilyID(c))
	if err != nil {
		response.Internal(c, "获取家庭信息失败")
		return
	}
	response.OK(c, data)
}

func (h *Handler) ListKids(c *gin.Context) {
	data, err := h.svc.GetFamilyMe(middleware.GetFamilyID(c))
	if err != nil {
		response.Internal(c, "获取孩子列表失败")
		return
	}
	response.OK(c, data["kids"])
}

func (h *Handler) CreateKid(c *gin.Context) {
	var req model.Kid
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		response.BadRequest(c, "孩子姓名不能为空")
		return
	}
	if err := h.svc.CreateKid(middleware.GetFamilyID(c), &req); err != nil {
		response.Internal(c, "创建失败")
		return
	}
	response.OK(c, req)
}

func (h *Handler) GetKidPoints(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	data, err := h.svc.GetKidPoints(middleware.GetFamilyID(c), id)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, data)
}

func (h *Handler) ListPointActions(c *gin.Context) {
	actions, err := h.svc.ListPointActions(middleware.GetFamilyID(c), c.Query("type"))
	if err != nil {
		response.Internal(c, "查询失败")
		return
	}
	response.OK(c, actions)
}

func (h *Handler) CreatePointAction(c *gin.Context) {
	var req model.PointAction
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	if err := h.svc.CreatePointAction(middleware.GetFamilyID(c), &req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, req)
}

func (h *Handler) UpdatePointAction(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	var req model.PointAction
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	req.ID = id
	if err := h.svc.UpdatePointAction(middleware.GetFamilyID(c), &req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, req)
}

func (h *Handler) DeletePointAction(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	if err := h.svc.DeletePointAction(middleware.GetFamilyID(c), id); err != nil {
		response.Internal(c, "删除失败")
		return
	}
	response.OK(c, nil)
}

func (h *Handler) DownloadImportTemplate(c *gin.Context) {
	data, err := excel.BuildImportTemplate()
	if err != nil {
		response.Internal(c, "生成模板失败")
		return
	}
	c.Header("Content-Disposition", `attachment; filename="growth-points-template.xlsx"`)
	c.Header("Content-Length", strconv.Itoa(len(data)))
	c.Data(200, excel.ImportTemplateMimeType(), data)
}

func generateTempName(ext string) (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return "import_" + hex.EncodeToString(buf) + ext, nil
}

func (h *Handler) ImportPointActions(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "请上传 Excel 文件")
		return
	}
	if file.Size > maxExcelUploadBytes {
		response.BadRequest(c, "文件超过 5MB 限制")
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExcelExts[ext] {
		response.BadRequest(c, "仅支持 .xlsx / .xls 文件")
		return
	}
	tmpName, err := generateTempName(ext)
	if err != nil {
		response.Internal(c, "保存文件失败")
		return
	}
	tmpPath := filepath.Join(os.TempDir(), tmpName)
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		response.Internal(c, "保存文件失败")
		return
	}
	defer os.Remove(tmpPath)

	result, err := h.svc.ImportExcel(middleware.GetFamilyID(c), tmpPath)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, gin.H{
		"actions_count": len(result.Actions),
		"rewards_count": len(result.Rewards),
		"warnings":      result.Warnings,
	})
}

func (h *Handler) CreatePointRecord(c *gin.Context) {
	var req struct {
		KidID    uint   `json:"kid_id" binding:"required"`
		ActionID uint   `json:"action_id" binding:"required"`
		Note     string `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	record, err := h.svc.AddPointRecord(
		middleware.GetFamilyID(c),
		middleware.GetUserID(c),
		req.KidID,
		req.ActionID,
		req.Note,
	)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, record)
}

func (h *Handler) ListPointRecords(c *gin.Context) {
	records, err := h.svc.ListPointRecords(middleware.GetFamilyID(c), queryKidID(c), 100)
	if err != nil {
		response.Internal(c, "查询失败")
		return
	}
	response.OK(c, records)
}

func (h *Handler) PointSummary(c *gin.Context) {
	kid := queryKidID(c)
	if kid == nil {
		response.BadRequest(c, "kid_id 必填")
		return
	}
	data, err := h.svc.PointSummary(middleware.GetFamilyID(c), *kid)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, data)
}

func (h *Handler) RevokePointRecord(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	if err := h.svc.RevokePointRecord(middleware.GetFamilyID(c), middleware.GetUserID(c), id); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, nil)
}

func (h *Handler) ListRewards(c *gin.Context) {
	rewards, err := h.svc.ListRewards(middleware.GetFamilyID(c))
	if err != nil {
		response.Internal(c, "查询失败")
		return
	}
	response.OK(c, rewards)
}

func (h *Handler) CreateReward(c *gin.Context) {
	var req model.Reward
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	if err := h.svc.CreateReward(middleware.GetFamilyID(c), &req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, req)
}

func (h *Handler) UpdateReward(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	var req model.Reward
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	req.ID = id
	if err := h.svc.UpdateReward(middleware.GetFamilyID(c), &req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, req)
}

func (h *Handler) DeleteReward(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	if err := h.svc.DeleteReward(middleware.GetFamilyID(c), id); err != nil {
		response.Internal(c, "删除失败")
		return
	}
	response.OK(c, nil)
}

func (h *Handler) CreateRedemption(c *gin.Context) {
	var req struct {
		KidID    uint `json:"kid_id" binding:"required"`
		RewardID uint `json:"reward_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	item, err := h.svc.RedeemReward(
		middleware.GetFamilyID(c),
		middleware.GetUserID(c),
		req.KidID,
		req.RewardID,
	)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, item)
}

func (h *Handler) ListRedemptions(c *gin.Context) {
	items, err := h.svc.ListRedemptions(middleware.GetFamilyID(c), queryKidID(c))
	if err != nil {
		response.Internal(c, "查询失败")
		return
	}
	response.OK(c, items)
}

func (h *Handler) FulfillRedemption(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	item, err := h.svc.FulfillRedemption(middleware.GetFamilyID(c), id)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, item)
}

func (h *Handler) CancelRedemption(c *gin.Context) {
	id, ok := uriID(c)
	if !ok {
		return
	}
	item, err := h.svc.CancelRedemption(middleware.GetFamilyID(c), id)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, item)
}
