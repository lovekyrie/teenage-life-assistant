package excel

import (
	"bytes"

	"github.com/xuri/excelize/v2"
)

const templateMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

func ImportTemplateMimeType() string {
	return templateMimeType
}

func BuildImportTemplate() ([]byte, error) {
	f := excelize.NewFile()
	defaultSheet := f.GetSheetName(0)

	actionSheet := "积分行为"
	actionIndex, err := f.NewSheet(actionSheet)
	if err != nil {
		return nil, err
	}
	rewardSheet := "奖励"
	if _, err := f.NewSheet(rewardSheet); err != nil {
		return nil, err
	}
	guideSheet := "填写说明"
	if _, err := f.NewSheet(guideSheet); err != nil {
		return nil, err
	}
	if defaultSheet != "" {
		if err := f.DeleteSheet(defaultSheet); err != nil {
			return nil, err
		}
	}
	f.SetActiveSheet(actionIndex)

	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"2F4858"}, Pattern: 1},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	if err != nil {
		return nil, err
	}
	noteStyle, err := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "4B5563"},
		Alignment: &excelize.Alignment{WrapText: true, Vertical: "top"},
	})
	if err != nil {
		return nil, err
	}

	actionRows := [][]interface{}{
		{"类型", "类别", "行为名称", "分值", "说明", "每日上限", "排序"},
		{"add", "生活", "自己整理书包", 2, "每天放学后整理", 1, 1},
		{"add", "学习", "主动阅读", 3, "连续阅读 15 分钟", 1, 2},
		{"add", "家务", "帮忙收拾餐桌", 2, "", 1, 3},
		{"subtract", "规则", "拖延作业", 2, "超过约定时间", "", 4},
		{"subtract", "礼貌", "乱发脾气", 3, "", 2, 5},
	}
	if err := writeRows(f, actionSheet, actionRows); err != nil {
		return nil, err
	}
	if err := f.SetCellStyle(actionSheet, "A1", "G1", headerStyle); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(actionSheet, "A", "A", 14); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(actionSheet, "B", "C", 18); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(actionSheet, "D", "G", 12); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(actionSheet, "E", "E", 28); err != nil {
		return nil, err
	}

	rewardRows := [][]interface{}{
		{"名称", "所需积分", "描述", "库存"},
		{"看一集动画", 10, "15 分钟", ""},
		{"周末户外活动", 30, "一次公园或球类活动", ""},
		{"小玩具", 50, "可设置库存", 5},
	}
	if err := writeRows(f, rewardSheet, rewardRows); err != nil {
		return nil, err
	}
	if err := f.SetCellStyle(rewardSheet, "A1", "D1", headerStyle); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(rewardSheet, "A", "A", 18); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(rewardSheet, "B", "D", 14); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(rewardSheet, "C", "C", 28); err != nil {
		return nil, err
	}

	guideRows := [][]interface{}{
		{"填写步骤"},
		{"1. 在「积分行为」工作表中填写加分和扣分行为。类型只能填写 add 或 subtract。"},
		{"2. 分值、每日上限、排序都填写正整数；每日上限和排序可以留空。"},
		{"3. 在「奖励」工作表中填写可兑换奖励；库存留空表示不限量，填写 0 表示暂时不可兑换。"},
		{"4. 上传模板后，系统会按模板启用行为和奖励；未出现在模板中的旧行为和旧奖励会停用，历史记录保留。"},
		{"5. 请保留工作表名称和表头顺序，不要合并单元格。"},
	}
	if err := writeRows(f, guideSheet, guideRows); err != nil {
		return nil, err
	}
	if err := f.SetCellStyle(guideSheet, "A1", "A1", headerStyle); err != nil {
		return nil, err
	}
	if err := f.SetCellStyle(guideSheet, "A2", "A6", noteStyle); err != nil {
		return nil, err
	}
	if err := f.SetColWidth(guideSheet, "A", "A", 82); err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeRows(f *excelize.File, sheet string, rows [][]interface{}) error {
	for i, row := range rows {
		cell, err := excelize.CoordinatesToCellName(1, i+1)
		if err != nil {
			return err
		}
		if err := f.SetSheetRow(sheet, cell, &row); err != nil {
			return err
		}
	}
	return nil
}
