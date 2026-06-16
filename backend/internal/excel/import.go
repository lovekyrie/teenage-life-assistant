package excel

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/duanyupeng/teenage-life-assistant/internal/model"
	"github.com/xuri/excelize/v2"
)

type ImportResult struct {
	Actions  []model.PointAction `json:"actions"`
	Rewards  []model.Reward      `json:"rewards"`
	Warnings []string            `json:"warnings"`
}

func ParseImportFile(path string, familyID uint) (*ImportResult, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	result := &ImportResult{}
	actions, warns, err := parseActions(f, familyID)
	if err != nil {
		return nil, fmt.Errorf("积分行为: %w", err)
	}
	result.Actions = actions
	result.Warnings = append(result.Warnings, warns...)

	rewards, warns, err := parseRewards(f, familyID)
	if err != nil {
		return nil, fmt.Errorf("奖励: %w", err)
	}
	result.Rewards = rewards
	result.Warnings = append(result.Warnings, warns...)

	return result, nil
}

func parseActions(f *excelize.File, familyID uint) ([]model.PointAction, []string, error) {
	sheet := findSheet(f, "积分行为", "point_actions")
	if sheet == "" {
		return nil, nil, fmt.Errorf("未找到「积分行为」工作表")
	}
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	var actions []model.PointAction
	var warnings []string
	for i, row := range rows {
		if i == 0 || len(row) == 0 {
			continue
		}
		lineNo := i + 1
		actionType := strings.ToLower(strings.TrimSpace(getCell(row, 0)))
		if actionType != "add" && actionType != "subtract" {
			warnings = append(warnings, fmt.Sprintf("第 %d 行：类型必须是 add 或 subtract，已跳过", lineNo))
			continue
		}
		name := strings.TrimSpace(getCell(row, 2))
		if name == "" {
			warnings = append(warnings, fmt.Sprintf("第 %d 行：名称为空，已跳过", lineNo))
			continue
		}
		points, err := strconv.Atoi(strings.TrimSpace(getCell(row, 3)))
		if err != nil || points <= 0 {
			warnings = append(warnings, fmt.Sprintf("第 %d 行：分值无效，已跳过", lineNo))
			continue
		}
		var dailyLimit *int
		if v := strings.TrimSpace(getCell(row, 5)); v != "" {
			limit, err := strconv.Atoi(v)
			if err != nil || limit < 0 {
				warnings = append(warnings, fmt.Sprintf("第 %d 行：每日上限无效，已忽略该字段", lineNo))
			} else {
				dailyLimit = &limit
			}
		}
		sortOrder := i
		if v := strings.TrimSpace(getCell(row, 6)); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				sortOrder = n
			}
		}
		actions = append(actions, model.PointAction{
			FamilyID:    familyID,
			Type:        actionType,
			Category:    strings.TrimSpace(getCell(row, 1)),
			Name:        name,
			Points:      points,
			Description: strings.TrimSpace(getCell(row, 4)),
			DailyLimit:  dailyLimit,
			SortOrder:   sortOrder,
			Enabled:     true,
		})
	}
	return actions, warnings, nil
}

func parseRewards(f *excelize.File, familyID uint) ([]model.Reward, []string, error) {
	sheet := findSheet(f, "奖励", "rewards")
	if sheet == "" {
		return []model.Reward{}, nil, nil
	}
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	var rewards []model.Reward
	var warnings []string
	for i, row := range rows {
		if i == 0 || len(row) == 0 {
			continue
		}
		lineNo := i + 1
		name := strings.TrimSpace(getCell(row, 0))
		if name == "" {
			continue
		}
		pointsCost, err := strconv.Atoi(strings.TrimSpace(getCell(row, 1)))
		if err != nil || pointsCost <= 0 {
			warnings = append(warnings, fmt.Sprintf("奖励第 %d 行：所需积分无效，已跳过", lineNo))
			continue
		}
		stock := -1
		if v := strings.TrimSpace(getCell(row, 3)); v != "" {
			if n, err := strconv.Atoi(v); err == nil && n >= 0 {
				stock = n
			} else {
				warnings = append(warnings, fmt.Sprintf("奖励第 %d 行：库存无效，按无限处理", lineNo))
			}
		}
		rewards = append(rewards, model.Reward{
			FamilyID:    familyID,
			Name:        name,
			PointsCost:  pointsCost,
			Description: strings.TrimSpace(getCell(row, 2)),
			Stock:       stock,
			Enabled:     true,
		})
	}
	return rewards, warnings, nil
}

func findSheet(f *excelize.File, names ...string) string {
	sheets := f.GetSheetList()
	for _, name := range names {
		for _, s := range sheets {
			if s == name {
				return s
			}
		}
	}
	return ""
}

func getCell(row []string, idx int) string {
	if idx >= len(row) {
		return ""
	}
	return row[idx]
}
