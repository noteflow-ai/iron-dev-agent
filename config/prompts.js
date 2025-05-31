/**
 * 系统提示词配置文件
 * 包含PRD和UI生成的默认提示词
 */

// 获取当前日期
const currentDate = new Date().toISOString().split('T')[0];

// PRD提示词 
const prdDefaultSysPrompt =  `你是一位资深的产品经理。`;

// UI 提示词 
const uiDefaultSysPrompt = `你是一位专业的UI设计师。`;

// 导出提示词
module.exports = {
  prd: {
    prompt: prdDefaultSysPrompt
  },
  ui: {
    prompt: uiDefaultSysPrompt
  }
};
