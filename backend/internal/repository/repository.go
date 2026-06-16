package repository

import (
	"time"

	"github.com/duanyupeng/teenage-life-assistant/internal/model"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) DB() *gorm.DB {
	return r.db
}

func (r *Repository) FindUserByOpenID(openid string) (*model.User, error) {
	var user model.User
	err := r.db.Where("openid = ?", openid).First(&user).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &user, err
}

func (r *Repository) CreateUser(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) UpdateUser(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *Repository) GetUserByID(id uint) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) CreateFamily(family *model.Family) error {
	return r.db.Create(family).Error
}

func (r *Repository) FindFamilyByInviteCode(code string) (*model.Family, error) {
	var family model.Family
	err := r.db.Where("invite_code = ?", code).First(&family).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &family, err
}

func (r *Repository) GetFamilyByID(id uint) (*model.Family, error) {
	var family model.Family
	if err := r.db.First(&family, id).Error; err != nil {
		return nil, err
	}
	return &family, nil
}

func (r *Repository) ListKids(familyID uint) ([]model.Kid, error) {
	var kids []model.Kid
	err := r.db.Where("family_id = ?", familyID).Order("id asc").Find(&kids).Error
	return kids, err
}

func (r *Repository) CreateKid(kid *model.Kid) error {
	return r.db.Create(kid).Error
}

func (r *Repository) GetKid(familyID, kidID uint) (*model.Kid, error) {
	var kid model.Kid
	err := r.db.Where("id = ? AND family_id = ?", kidID, familyID).First(&kid).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &kid, err
}

func (r *Repository) ListPointActions(familyID uint, actionType string) ([]model.PointAction, error) {
	var actions []model.PointAction
	q := r.db.Where("family_id = ? AND enabled = ?", familyID, true)
	if actionType != "" {
		q = q.Where("type = ?", actionType)
	}
	err := q.Order("points asc, sort_order asc, id asc").Find(&actions).Error
	return actions, err
}

func (r *Repository) CreatePointAction(action *model.PointAction) error {
	return r.db.Create(action).Error
}

func (r *Repository) UpdatePointAction(action *model.PointAction) error {
	return r.db.Save(action).Error
}

func (r *Repository) DeletePointAction(familyID, id uint) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&model.PointAction{}).Error
}

func (r *Repository) GetPointAction(familyID, id uint) (*model.PointAction, error) {
	var action model.PointAction
	err := r.db.Where("id = ? AND family_id = ?", id, familyID).First(&action).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &action, err
}

func (r *Repository) UpsertPointActions(familyID uint, actions []model.PointAction) error {
	if err := r.db.Model(&model.PointAction{}).Where("family_id = ?", familyID).Update("enabled", false).Error; err != nil {
		return err
	}
	for i := range actions {
		a := actions[i]
		var existing model.PointAction
		err := r.db.Where("family_id = ? AND type = ? AND name = ? AND points = ?", familyID, a.Type, a.Name, a.Points).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := r.db.Create(&a).Error; err != nil {
				return err
			}
			continue
		}
		if err != nil {
			return err
		}
		existing.Category = a.Category
		existing.Description = a.Description
		existing.DailyLimit = a.DailyLimit
		existing.SortOrder = a.SortOrder
		existing.Enabled = true
		if err := r.db.Save(&existing).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) UpsertRewards(familyID uint, rewards []model.Reward) error {
	if err := r.db.Model(&model.Reward{}).Where("family_id = ?", familyID).Update("enabled", false).Error; err != nil {
		return err
	}
	for i := range rewards {
		w := rewards[i]
		var existing model.Reward
		err := r.db.Where("family_id = ? AND name = ?", familyID, w.Name).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := r.db.Create(&w).Error; err != nil {
				return err
			}
			continue
		}
		if err != nil {
			return err
		}
		existing.PointsCost = w.PointsCost
		existing.Description = w.Description
		existing.Stock = w.Stock
		existing.Enabled = true
		if err := r.db.Save(&existing).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) SoftDisablePointAction(familyID, id uint) error {
	return r.db.Model(&model.PointAction{}).Where("id = ? AND family_id = ?", id, familyID).Update("enabled", false).Error
}

func (r *Repository) SoftDisableReward(familyID, id uint) error {
	return r.db.Model(&model.Reward{}).Where("id = ? AND family_id = ?", id, familyID).Update("enabled", false).Error
}

func (r *Repository) CreatePointRecord(record *model.PointRecord) error {
	return r.db.Create(record).Error
}

func (r *Repository) ListPointRecords(familyID uint, kidID *uint, limit int) ([]model.PointRecord, error) {
	var records []model.PointRecord
	q := r.db.Preload("Action").Where("family_id = ?", familyID)
	if kidID != nil {
		q = q.Where("kid_id = ?", *kidID)
	}
	if limit > 0 {
		q = q.Limit(limit)
	}
	err := q.Order("created_at desc").Find(&records).Error
	return records, err
}

func (r *Repository) GetPointRecord(familyID, id uint) (*model.PointRecord, error) {
	var record model.PointRecord
	err := r.db.Where("id = ? AND family_id = ?", id, familyID).First(&record).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &record, err
}

func (r *Repository) DeletePointRecord(familyID, id uint) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&model.PointRecord{}).Error
}

func (r *Repository) CountTodayActionUsage(familyID, kidID, actionID uint) (int64, error) {
	start := time.Now().Truncate(24 * time.Hour)
	var count int64
	err := r.db.Model(&model.PointRecord{}).
		Where("family_id = ? AND kid_id = ? AND action_id = ? AND created_at >= ?", familyID, kidID, actionID, start).
		Count(&count).Error
	return count, err
}

func (r *Repository) SumPointRecords(familyID, kidID uint) (addSum, subSum int64, err error) {
	err = r.db.Model(&model.PointRecord{}).
		Where("family_id = ? AND kid_id = ? AND type = ?", familyID, kidID, "add").
		Select("COALESCE(SUM(points), 0)").Scan(&addSum).Error
	if err != nil {
		return
	}
	err = r.db.Model(&model.PointRecord{}).
		Where("family_id = ? AND kid_id = ? AND type = ?", familyID, kidID, "subtract").
		Select("COALESCE(SUM(points), 0)").Scan(&subSum).Error
	return
}

func (r *Repository) SumRedemptions(familyID, kidID uint) (int64, error) {
	var sum int64
	err := r.db.Model(&model.Redemption{}).
		Where("family_id = ? AND kid_id = ? AND status != ?", familyID, kidID, "cancelled").
		Select("COALESCE(SUM(points_cost), 0)").Scan(&sum).Error
	return sum, err
}

func (r *Repository) SumTodayPointRecords(familyID, kidID uint) (addSum, subSum int64, err error) {
	start := time.Now().Truncate(24 * time.Hour)
	err = r.db.Model(&model.PointRecord{}).
		Where("family_id = ? AND kid_id = ? AND type = ? AND created_at >= ?", familyID, kidID, "add", start).
		Select("COALESCE(SUM(points), 0)").Scan(&addSum).Error
	if err != nil {
		return
	}
	err = r.db.Model(&model.PointRecord{}).
		Where("family_id = ? AND kid_id = ? AND type = ? AND created_at >= ?", familyID, kidID, "subtract", start).
		Select("COALESCE(SUM(points), 0)").Scan(&subSum).Error
	return
}

func (r *Repository) ListRewards(familyID uint) ([]model.Reward, error) {
	var rewards []model.Reward
	err := r.db.Where("family_id = ? AND enabled = ?", familyID, true).Order("points_cost asc, id asc").Find(&rewards).Error
	return rewards, err
}

func (r *Repository) CreateReward(reward *model.Reward) error {
	return r.db.Create(reward).Error
}

func (r *Repository) UpdateReward(reward *model.Reward) error {
	return r.db.Save(reward).Error
}

func (r *Repository) DeleteReward(familyID, id uint) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&model.Reward{}).Error
}

func (r *Repository) GetReward(familyID, id uint) (*model.Reward, error) {
	var reward model.Reward
	err := r.db.Where("id = ? AND family_id = ?", id, familyID).First(&reward).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &reward, err
}

func (r *Repository) CreateRedemption(redemption *model.Redemption) error {
	return r.db.Create(redemption).Error
}

func (r *Repository) ListRedemptions(familyID uint, kidID *uint) ([]model.Redemption, error) {
	var items []model.Redemption
	q := r.db.Preload("Reward").Where("family_id = ?", familyID)
	if kidID != nil {
		q = q.Where("kid_id = ?", *kidID)
	}
	err := q.Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *Repository) GetRedemption(familyID, id uint) (*model.Redemption, error) {
	var item model.Redemption
	err := r.db.Preload("Reward").Where("id = ? AND family_id = ?", id, familyID).First(&item).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &item, err
}

func (r *Repository) UpdateRedemption(item *model.Redemption) error {
	return r.db.Save(item).Error
}

func (r *Repository) CountActiveRedemptions(familyID, rewardID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Redemption{}).
		Where("family_id = ? AND reward_id = ? AND status != ?", familyID, rewardID, "cancelled").
		Count(&count).Error
	return count, err
}
