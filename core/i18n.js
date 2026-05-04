// Octile Universe Guideline: Avoid exclamation marks in all UI copy.
// Tone should be calm, restrained, and respectful.

const translations = {
  en: {
    // Difficulty
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',

    // UI buttons and labels
    'ui.button.newGame': 'New Game',
    'ui.button.playAgain': 'Play again',
    'ui.label.minesRemaining': 'Mines remaining',
    'ui.label.timer': 'Timer',

    // Modal - Win
    'modal.win.title': 'Completed',
    'modal.win.time': (time) => `Time: ${time}`,
    'modal.win.best': (time) => `Best: ${time}`,

    // Modal - Lose
    'modal.lose.title': 'Game Over',
    'modal.lose.message': 'That was a mine.',

    // Octile Universe cross-promo (post-satisfaction only)
    'promo.prefix': 'Explore further: ',
    'promo.label': 'Octile',
    'promo.url': 'https://play.google.com/store/apps/details?id=com.octile.app',

    // Help modal (to be added)
    'help.title': 'How to Play',
    'help.objective': 'Reveal all cells without hitting any mines.',
    'help.section.controls': 'Controls',
    'help.controls.leftClick': 'Left click or tap: Reveal cell',
    'help.controls.rightClick': 'Right click or long press: Place flag',
    'help.controls.numbers': 'Numbers show how many mines are adjacent to that cell',
    'help.controls.firstClick': 'First click is always safe',
    'help.section.strategy': 'Strategy',
    'help.strategy': 'Use the numbers to deduce where mines are located. Place flags on suspected mines to track your progress.',
    'help.octile': 'If you enjoy logical deduction puzzles, Octile offers deeper spatial reasoning challenges.',
    'help.close': 'Close',
    'help.contactLabel': 'Contact:',
    'help.contactAlt': 'If mail app doesn\'t open, please email us at: octileapp@googlegroups.com',

    // Contact
    'contact.email': 'octileapp@googlegroups.com',
    'footer.contact': 'Contact',

    // Privacy & Feedback (to be added)
    'privacy.title': 'Privacy Policy',
    'feedback.title': 'Send Feedback',
    'feedback.emailLabel': 'Email (optional)',
    'feedback.messageLabel': 'Message',
    'feedback.submit': 'Send',
    'feedback.screenshotLabel': 'Screenshot (optional)',

    // OTA banner (to be added)
    'ota.updateAvailable': 'Update available',
    'ota.updateRequired': 'Update required to continue',
    'ota.updateBtn': 'Update',
    'ota.later': 'Later',
    'ota.restart': 'Restart',

    // AdMob consent (to be added)
    'admob.consentTitle': 'Personalized Ads',
    'admob.consentMessage': 'We use ads to support this free game. Allow personalized ads?',
    'admob.accept': 'Accept',
    'admob.decline': 'No thanks',

    // Branding
    'branding.footer': 'An Octile Universe game',
    'branding.octileLink': 'Octile',

    // Language toggle
    'lang.toggle': '中文',
  },

  zh: {
    // Difficulty
    'difficulty.easy': '簡單',
    'difficulty.medium': '中等',
    'difficulty.hard': '困難',

    // UI buttons and labels
    'ui.button.newGame': '新遊戲',
    'ui.button.playAgain': '再玩一次',
    'ui.label.minesRemaining': '剩餘地雷',
    'ui.label.timer': '計時器',

    // Modal - Win
    'modal.win.title': '完成',
    'modal.win.time': (time) => `時間：${time}`,
    'modal.win.best': (time) => `最佳：${time}`,

    // Modal - Lose
    'modal.lose.title': '遊戲結束',
    'modal.lose.message': '這是地雷。',

    // Octile Universe cross-promo
    'promo.prefix': '探索更多：',
    'promo.label': 'Octile',
    'promo.url': 'https://play.google.com/store/apps/details?id=com.octile.app',

    // Help modal
    'help.title': '如何遊玩',
    'help.objective': '揭開所有方格而不踩到地雷。',
    'help.section.controls': '操作方式',
    'help.controls.leftClick': '左鍵點擊或輕觸：揭開方格',
    'help.controls.rightClick': '右鍵點擊或長按：放置旗幟',
    'help.controls.numbers': '數字顯示該方格相鄰有多少個地雷',
    'help.controls.firstClick': '第一次點擊永遠安全',
    'help.section.strategy': '策略',
    'help.strategy': '利用數字推斷地雷位置。在可疑的地雷處放置旗幟以追蹤進度。',
    'help.octile': '如果你喜歡邏輯推理遊戲，Octile 提供更深入的空間推理挑戰。',
    'help.close': '關閉',
    'help.contactLabel': '聯絡：',
    'help.contactAlt': '如果郵件應用程式無法開啟，請發送郵件至：octileapp@googlegroups.com',

    // Contact
    'contact.email': 'octileapp@googlegroups.com',
    'footer.contact': '聯絡',

    // Privacy & Feedback
    'privacy.title': '隱私政策',
    'feedback.title': '傳送意見回饋',
    'feedback.emailLabel': '電子郵件（選填）',
    'feedback.messageLabel': '訊息',
    'feedback.submit': '傳送',
    'feedback.screenshotLabel': '螢幕截圖（選填）',

    // OTA banner
    'ota.updateAvailable': '可用更新',
    'ota.updateRequired': '需要更新才能繼續',
    'ota.updateBtn': '更新',
    'ota.later': '稍後',
    'ota.restart': '重新啟動',

    // AdMob consent
    'admob.consentTitle': '個人化廣告',
    'admob.consentMessage': '我們使用廣告支持這款免費遊戲。允許個人化廣告嗎？',
    'admob.accept': '接受',
    'admob.decline': '不用了',

    // Branding
    'branding.footer': 'Octile Universe 遊戲',
    'branding.octileLink': 'Octile',

    // Language toggle
    'lang.toggle': 'EN',
  },
};

const GAME_ID = 'mine';
const NEW_LANG_KEY = `octile:${GAME_ID}:lang`;
const OLD_LANG_KEY = 'mine-lang'; // Old key used before standardization

let currentLang = 'en';

export function init() {
  // Migration: Move old key to new game_id-scoped key
  if (!localStorage.getItem(NEW_LANG_KEY) && localStorage.getItem(OLD_LANG_KEY)) {
    const oldLang = localStorage.getItem(OLD_LANG_KEY);
    localStorage.setItem(NEW_LANG_KEY, oldLang);
    localStorage.removeItem(OLD_LANG_KEY);
  }

  const saved = localStorage.getItem(NEW_LANG_KEY);
  currentLang = (saved === 'zh') ? 'zh' : 'en';
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = (lang === 'zh') ? 'zh' : 'en';
  localStorage.setItem(NEW_LANG_KEY, currentLang);
}

export function t(key) {
  const value = translations[currentLang][key] || translations.en[key];

  // If value is a function (like WIN_TIME), return the function
  if (typeof value === 'function') {
    return value;
  }

  // Otherwise return the string or the key if not found
  return value || key;
}
