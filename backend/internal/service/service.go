package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/duanyupeng/teenage-life-assistant/internal/config"
	"github.com/duanyupeng/teenage-life-assistant/internal/excel"
	"github.com/duanyupeng/teenage-life-assistant/internal/middleware"
	"github.com/duanyupeng/teenage-life-assistant/internal/model"
	"github.com/duanyupeng/teenage-life-assistant/internal/repository"
	"github.com/duanyupeng/teenage-life-assistant/internal/util"
	"github.com/duanyupeng/teenage-life-assistant/internal/wechat"
	"gorm.io/gorm"
)

const revokeWindow = 24 * time.Hour

type Service struct {
	repo   *repository.Repository
	cfg    *config.Config
	wechat *wechat.Client
}

func New(repo *repository.Repository, cfg *config.Config) *Service {
	return &Service{
		repo:   repo,
		cfg:    cfg,
		wechat: wechat.NewClient(cfg.WechatAppID, cfg.WechatAppSecret, cfg.DevMockWechat),
	}
}

func (s *Service) LookupUserFamily(userID uint) (*uint, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	return user.FamilyID, nil
}

type LoginResult struct {
	Token      string      `json:"token"`
	NeedFamily bool        `json:"need_family"`
	User       *model.User `json:"user"`
}

func (s *Service) Login(code string) (*LoginResult, error) {
	session, err := s.wechat.Code2Session(code)
	if err != nil {
		return nil, err
	}
	user, err := s.repo.FindUserByOpenID(session.OpenID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		user = &model.User{OpenID: session.OpenID, Role: "member"}
		if err := s.repo.CreateUser(user); err != nil {
			return nil, err
		}
	}
	token, err := middleware.SignToken(s.cfg.JWTSecret, user.ID, user.OpenID)
	if err != nil {
		return nil, err
	}
	return &LoginResult{
		Token:      token,
		NeedFamily: user.FamilyID == nil,
		User:       user,
	}, nil
}

func (s *Service) CreateFamily(userID uint, name string) (*model.Family, *model.User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, nil, err
	}
	if user.FamilyID != nil {
		return nil, nil, errors.New("已加入家庭")
	}
	code, err := util.GenerateInviteCode(6)
	if err != nil {
		return nil, nil, err
	}
	family := &model.Family{Name: name, InviteCode: code}
	if err := s.repo.CreateFamily(family); err != nil {
		return nil, nil, err
	}
	user.FamilyID = &family.ID
	user.Role = "admin"
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, nil, err
	}
	return family, user, nil
}

func (s *Service) JoinFamily(userID uint, inviteCode string) (*model.Family, *model.User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, nil, err
	}
	if user.FamilyID != nil {
		return nil, nil, errors.New("已加入家庭")
	}
	family, err := s.repo.FindFamilyByInviteCode(inviteCode)
	if err != nil {
		return nil, nil, err
	}
	if family == nil {
		return nil, nil, errors.New("邀请码无效")
	}
	user.FamilyID = &family.ID
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, nil, err
	}
	return family, user, nil
}

func (s *Service) GetFamilyMe(familyID uint) (map[string]interface{}, error) {
	family, err := s.repo.GetFamilyByID(familyID)
	if err != nil {
		return nil, err
	}
	kids, err := s.repo.ListKids(familyID)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"family": family,
		"kids":   kids,
	}, nil
}

func (s *Service) CreateKid(familyID uint, kid *model.Kid) error {
	kid.FamilyID = familyID
	return s.repo.CreateKid(kid)
}

func (s *Service) GetKidPoints(familyID, kidID uint) (map[string]interface{}, error) {
	kid, err := s.repo.GetKid(familyID, kidID)
	if err != nil {
		return nil, err
	}
	if kid == nil {
		return nil, errors.New("孩子不存在")
	}
	total, err := s.calcTotalPoints(s.repo, familyID, kidID)
	if err != nil {
		return nil, err
	}
	todayAdd, todaySub, err := s.repo.SumTodayPointRecords(familyID, kidID)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"kid_id":       kidID,
		"total_points": total,
		"today_add":    todayAdd,
		"today_sub":    todaySub,
		"today_net":    todayAdd - todaySub,
	}, nil
}

func (s *Service) calcTotalPoints(repo *repository.Repository, familyID, kidID uint) (int64, error) {
	addSum, subSum, err := repo.SumPointRecords(familyID, kidID)
	if err != nil {
		return 0, err
	}
	redeemSum, err := repo.SumRedemptions(familyID, kidID)
	if err != nil {
		return 0, err
	}
	return addSum - subSum - redeemSum, nil
}

func (s *Service) ListPointActions(familyID uint, actionType string) ([]model.PointAction, error) {
	return s.repo.ListPointActions(familyID, actionType)
}

func validateActionInput(action *model.PointAction) error {
	if action.Type != "add" && action.Type != "subtract" {
		return errors.New("类型必须为 add 或 subtract")
	}
	if action.Points <= 0 {
		return errors.New("分值必须大于 0")
	}
	if action.Name == "" {
		return errors.New("名称不能为空")
	}
	if action.DailyLimit != nil && *action.DailyLimit < 0 {
		return errors.New("每日上限不能为负数")
	}
	return nil
}

func (s *Service) CreatePointAction(familyID uint, action *model.PointAction) error {
	if err := validateActionInput(action); err != nil {
		return err
	}
	action.ID = 0
	action.FamilyID = familyID
	action.Enabled = true
	return s.repo.CreatePointAction(action)
}

func (s *Service) UpdatePointAction(familyID uint, action *model.PointAction) error {
	if err := validateActionInput(action); err != nil {
		return err
	}
	existing, err := s.repo.GetPointAction(familyID, action.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("行为不存在")
	}
	action.FamilyID = familyID
	return s.repo.UpdatePointAction(action)
}

func (s *Service) DeletePointAction(familyID, id uint) error {
	return s.repo.SoftDisablePointAction(familyID, id)
}

func (s *Service) ImportExcel(familyID uint, filePath string) (*excel.ImportResult, error) {
	result, err := excel.ParseImportFile(filePath, familyID)
	if err != nil {
		return nil, err
	}
	err = s.repo.DB().Transaction(func(tx *gorm.DB) error {
		repo := repository.New(tx)
		if err := repo.UpsertPointActions(familyID, result.Actions); err != nil {
			return err
		}
		return repo.UpsertRewards(familyID, result.Rewards)
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (s *Service) AddPointRecord(familyID, userID, kidID, actionID uint, note string) (*model.PointRecord, error) {
	var record *model.PointRecord
	err := s.repo.DB().Transaction(func(tx *gorm.DB) error {
		repo := repository.New(tx)
		kid, err := repo.GetKid(familyID, kidID)
		if err != nil {
			return err
		}
		if kid == nil {
			return errors.New("孩子不存在")
		}
		action, err := repo.GetPointAction(familyID, actionID)
		if err != nil {
			return err
		}
		if action == nil || !action.Enabled {
			return errors.New("积分行为不存在")
		}
		if action.DailyLimit != nil {
			count, err := repo.CountTodayActionUsage(familyID, kidID, actionID)
			if err != nil {
				return err
			}
			if count >= int64(*action.DailyLimit) {
				return fmt.Errorf("今日该行为已达上限 %d 次", *action.DailyLimit)
			}
		}
		if action.Type == "subtract" {
			total, err := s.calcTotalPoints(repo, familyID, kidID)
			if err != nil {
				return err
			}
			if total < int64(action.Points) {
				return errors.New("当前积分不足以扣减")
			}
		}
		record = &model.PointRecord{
			FamilyID:       familyID,
			KidID:          kidID,
			ActionID:       &actionID,
			Type:           action.Type,
			Points:         action.Points,
			OperatorUserID: userID,
			Note:           note,
		}
		return repo.CreatePointRecord(record)
	})
	if err != nil {
		return nil, err
	}
	return record, nil
}

func (s *Service) ListPointRecords(familyID uint, kidID *uint, limit int) ([]model.PointRecord, error) {
	return s.repo.ListPointRecords(familyID, kidID, limit)
}

func (s *Service) RevokePointRecord(familyID, userID, id uint) error {
	record, err := s.repo.GetPointRecord(familyID, id)
	if err != nil {
		return err
	}
	if record == nil {
		return errors.New("记录不存在")
	}
	if time.Since(record.CreatedAt) > revokeWindow {
		return errors.New("仅支持撤销 24 小时内的记录")
	}
	if record.OperatorUserID != userID {
		return errors.New("仅可撤销自己创建的记录")
	}
	return s.repo.DeletePointRecord(familyID, id)
}

func (s *Service) PointSummary(familyID, kidID uint) (map[string]interface{}, error) {
	total, err := s.calcTotalPoints(s.repo, familyID, kidID)
	if err != nil {
		return nil, err
	}
	todayAdd, todaySub, err := s.repo.SumTodayPointRecords(familyID, kidID)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"total_points": total,
		"today_add":    todayAdd,
		"today_sub":    todaySub,
		"today_net":    todayAdd - todaySub,
	}, nil
}

func (s *Service) ListRewards(familyID uint) ([]model.Reward, error) {
	return s.repo.ListRewards(familyID)
}

func validateRewardInput(reward *model.Reward) error {
	if reward.Name == "" {
		return errors.New("名称不能为空")
	}
	if reward.PointsCost <= 0 {
		return errors.New("所需积分必须大于 0")
	}
	if reward.Stock < -1 {
		return errors.New("库存只能为 -1（无限）或非负整数")
	}
	return nil
}

func (s *Service) CreateReward(familyID uint, reward *model.Reward) error {
	if err := validateRewardInput(reward); err != nil {
		return err
	}
	reward.ID = 0
	reward.FamilyID = familyID
	reward.Enabled = true
	return s.repo.CreateReward(reward)
}

func (s *Service) UpdateReward(familyID uint, reward *model.Reward) error {
	if err := validateRewardInput(reward); err != nil {
		return err
	}
	existing, err := s.repo.GetReward(familyID, reward.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("奖励不存在")
	}
	reward.FamilyID = familyID
	return s.repo.UpdateReward(reward)
}

func (s *Service) DeleteReward(familyID, id uint) error {
	return s.repo.SoftDisableReward(familyID, id)
}

func (s *Service) RedeemReward(familyID, userID, kidID, rewardID uint) (*model.Redemption, error) {
	var item *model.Redemption
	err := s.repo.DB().Transaction(func(tx *gorm.DB) error {
		repo := repository.New(tx)
		kid, err := repo.GetKid(familyID, kidID)
		if err != nil {
			return err
		}
		if kid == nil {
			return errors.New("孩子不存在")
		}
		reward, err := repo.GetReward(familyID, rewardID)
		if err != nil {
			return err
		}
		if reward == nil || !reward.Enabled {
			return errors.New("奖励不存在")
		}
		if reward.Stock >= 0 {
			used, err := repo.CountActiveRedemptions(familyID, rewardID)
			if err != nil {
				return err
			}
			if used >= int64(reward.Stock) {
				return errors.New("奖励库存不足")
			}
		}
		total, err := s.calcTotalPoints(repo, familyID, kidID)
		if err != nil {
			return err
		}
		if total < int64(reward.PointsCost) {
			return errors.New("积分不足")
		}
		item = &model.Redemption{
			FamilyID:       familyID,
			KidID:          kidID,
			RewardID:       rewardID,
			PointsCost:     reward.PointsCost,
			Status:         "pending",
			OperatorUserID: userID,
		}
		return repo.CreateRedemption(item)
	})
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (s *Service) ListRedemptions(familyID uint, kidID *uint) ([]model.Redemption, error) {
	return s.repo.ListRedemptions(familyID, kidID)
}

func (s *Service) FulfillRedemption(familyID, id uint) (*model.Redemption, error) {
	item, err := s.repo.GetRedemption(familyID, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, errors.New("兑换记录不存在")
	}
	if item.Status != "pending" {
		return nil, errors.New("当前状态不可标记发放")
	}
	now := time.Now()
	item.Status = "fulfilled"
	item.FulfilledAt = &now
	if err := s.repo.UpdateRedemption(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *Service) CancelRedemption(familyID, id uint) (*model.Redemption, error) {
	item, err := s.repo.GetRedemption(familyID, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, errors.New("兑换记录不存在")
	}
	if item.Status != "pending" {
		return nil, errors.New("仅可取消待发放的兑换")
	}
	item.Status = "cancelled"
	if err := s.repo.UpdateRedemption(item); err != nil {
		return nil, err
	}
	return item, nil
}
