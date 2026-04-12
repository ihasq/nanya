// 50 supported languages with native names and flags
export const SUPPORTED_LANGUAGES = {
  // East Asian
  'ja': { name: '日本語', flag: '🇯🇵', englishName: 'Japanese' },
  'zh-CN': { name: '简体中文', flag: '🇨🇳', englishName: 'Chinese (Simplified)' },
  'zh-TW': { name: '繁體中文', flag: '🇹🇼', englishName: 'Chinese (Traditional)' },
  'ko': { name: '한국어', flag: '🇰🇷', englishName: 'Korean' },

  // Southeast Asian
  'vi': { name: 'Tiếng Việt', flag: '🇻🇳', englishName: 'Vietnamese' },
  'th': { name: 'ไทย', flag: '🇹🇭', englishName: 'Thai' },
  'id': { name: 'Bahasa Indonesia', flag: '🇮🇩', englishName: 'Indonesian' },
  'ms': { name: 'Bahasa Melayu', flag: '🇲🇾', englishName: 'Malay' },
  'tl': { name: 'Filipino', flag: '🇵🇭', englishName: 'Filipino' },
  'my': { name: 'မြန်မာ', flag: '🇲🇲', englishName: 'Burmese' },

  // South Asian
  'hi': { name: 'हिन्दी', flag: '🇮🇳', englishName: 'Hindi' },
  'bn': { name: 'বাংলা', flag: '🇧🇩', englishName: 'Bengali' },
  'ta': { name: 'தமிழ்', flag: '🇮🇳', englishName: 'Tamil' },
  'te': { name: 'తెలుగు', flag: '🇮🇳', englishName: 'Telugu' },
  'ur': { name: 'اردو', flag: '🇵🇰', englishName: 'Urdu' },

  // Western European
  'en': { name: 'English', flag: '🇺🇸', englishName: 'English' },
  'es': { name: 'Español', flag: '🇪🇸', englishName: 'Spanish' },
  'fr': { name: 'Français', flag: '🇫🇷', englishName: 'French' },
  'de': { name: 'Deutsch', flag: '🇩🇪', englishName: 'German' },
  'it': { name: 'Italiano', flag: '🇮🇹', englishName: 'Italian' },
  'pt': { name: 'Português', flag: '🇵🇹', englishName: 'Portuguese' },
  'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷', englishName: 'Portuguese (Brazil)' },
  'nl': { name: 'Nederlands', flag: '🇳🇱', englishName: 'Dutch' },

  // Northern European
  'sv': { name: 'Svenska', flag: '🇸🇪', englishName: 'Swedish' },
  'da': { name: 'Dansk', flag: '🇩🇰', englishName: 'Danish' },
  'no': { name: 'Norsk', flag: '🇳🇴', englishName: 'Norwegian' },
  'fi': { name: 'Suomi', flag: '🇫🇮', englishName: 'Finnish' },

  // Eastern European
  'ru': { name: 'Русский', flag: '🇷🇺', englishName: 'Russian' },
  'uk': { name: 'Українська', flag: '🇺🇦', englishName: 'Ukrainian' },
  'pl': { name: 'Polski', flag: '🇵🇱', englishName: 'Polish' },
  'cs': { name: 'Čeština', flag: '🇨🇿', englishName: 'Czech' },
  'sk': { name: 'Slovenčina', flag: '🇸🇰', englishName: 'Slovak' },
  'hu': { name: 'Magyar', flag: '🇭🇺', englishName: 'Hungarian' },
  'ro': { name: 'Română', flag: '🇷🇴', englishName: 'Romanian' },
  'bg': { name: 'Български', flag: '🇧🇬', englishName: 'Bulgarian' },
  'hr': { name: 'Hrvatski', flag: '🇭🇷', englishName: 'Croatian' },
  'sr': { name: 'Српски', flag: '🇷🇸', englishName: 'Serbian' },

  // Southern European
  'el': { name: 'Ελληνικά', flag: '🇬🇷', englishName: 'Greek' },
  'tr': { name: 'Türkçe', flag: '🇹🇷', englishName: 'Turkish' },

  // Middle Eastern
  'ar': { name: 'العربية', flag: '🇸🇦', englishName: 'Arabic' },
  'he': { name: 'עברית', flag: '🇮🇱', englishName: 'Hebrew' },
  'fa': { name: 'فارسی', flag: '🇮🇷', englishName: 'Persian' },

  // African
  'sw': { name: 'Kiswahili', flag: '🇰🇪', englishName: 'Swahili' },
  'af': { name: 'Afrikaans', flag: '🇿🇦', englishName: 'Afrikaans' },

  // Other
  'ca': { name: 'Català', flag: '🇪🇸', englishName: 'Catalan' },
  'eu': { name: 'Euskara', flag: '🇪🇸', englishName: 'Basque' },
  'gl': { name: 'Galego', flag: '🇪🇸', englishName: 'Galician' },
  'lt': { name: 'Lietuvių', flag: '🇱🇹', englishName: 'Lithuanian' },
  'lv': { name: 'Latviešu', flag: '🇱🇻', englishName: 'Latvian' },
  'et': { name: 'Eesti', flag: '🇪🇪', englishName: 'Estonian' },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// UI translation keys
type UITextKey =
  | 'app.name'
  | 'app.newTranslation'
  | 'sidebar.quickSelect'
  | 'sidebar.connected'
  | 'sidebar.notConnected'
  | 'settings.title'
  | 'settings.description'
  | 'settings.systemLanguage'
  | 'settings.systemLanguageDesc'
  | 'settings.translationModel'
  | 'settings.nativeLanguage'
  | 'settings.keyboardShortcuts'
  | 'settings.keyboardShortcutsDesc'
  | 'settings.saveHistory'
  | 'settings.saveHistoryDesc'
  | 'settings.translationHistory'
  | 'settings.historyStorageDesc'
  | 'settings.clearAllHistory'
  | 'settings.clearHistoryConfirm'
  | 'settings.contextTokens'
  | 'settings.fast'
  | 'settings.balanced'
  | 'settings.advanced'
  | 'input.placeholder'
  | 'input.translate'
  | 'input.translating'
  | 'input.retranslate'
  | 'input.editInput'
  | 'input.connectProvider'
  | 'input.inputLabel'
  | 'input.autoDetect'
  | 'input.translateOther'
  | 'input.aiHelper'
  | 'results.copied'
  | 'results.copy'
  | 'results.speak'
  | 'results.backTranslate'
  | 'results.backTranslating'
  | 'results.backTo'
  | 'results.translatedOne'
  | 'results.translatedMany'
  | 'results.adjust'
  | 'results.adjusting'
  | 'results.showMore'
  | 'results.example'
  | 'results.casual'
  | 'results.polite'
  | 'results.neutral'
  | 'results.catchy'
  | 'results.concise'
  | 'results.detailed'
  | 'results.natural'
  | 'results.lessAI'
  | 'results.alternative'
  | 'results.explanation'
  | 'auth.connect'
  | 'auth.success'
  | 'auth.redirecting'
  | 'auth.error'

// Translation dictionary type
type TranslationDict = Record<UITextKey, string>

// English translations (base)
const en: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': 'New Translation',
  'sidebar.quickSelect': 'Quick Select',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': 'Not Connected',
  'settings.title': 'Settings',
  'settings.description': 'Customize translation settings',
  'settings.systemLanguage': 'System Language',
  'settings.systemLanguageDesc': 'UI language and default translation target',
  'settings.translationModel': 'Translation Model',
  'settings.nativeLanguage': 'Native Language',
  'settings.keyboardShortcuts': 'Keyboard Shortcuts',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Enter to translate',
  'settings.saveHistory': 'Save History',
  'settings.saveHistoryDesc': 'Store translations locally',
  'settings.translationHistory': 'Translation History',
  'settings.historyStorageDesc': 'Stored with gzip compression in IndexedDB',
  'settings.clearAllHistory': 'Clear All History',
  'settings.clearHistoryConfirm': 'Delete all translation history?',
  'settings.contextTokens': 'Context',
  'settings.fast': 'Fast',
  'settings.balanced': 'Balanced',
  'settings.advanced': 'Advanced',
  'input.placeholder': 'Enter text to translate...',
  'input.translate': 'Translate',
  'input.translating': 'Translating...',
  'input.retranslate': 'Retranslate',
  'input.editInput': 'Edit Input',
  'input.connectProvider': 'Connect an LLM provider to translate',
  'input.inputLabel': 'Enter text to translate',
  'input.autoDetect': 'Auto-detect',
  'input.translateOther': 'Translate other text',
  'input.aiHelper': 'AI will detect the language and suggest translations in multiple styles',
  'results.copied': 'Copied!',
  'results.copy': 'Copy',
  'results.speak': 'Speak',
  'results.backTranslate': 'Back Translate',
  'results.backTranslating': 'Back translating...',
  'results.backTo': 'Back translates to...',
  'results.translatedOne': 'Translation complete',
  'results.translatedMany': 'Generated {count} translation variants',
  'results.adjust': 'Adjust',
  'results.adjusting': 'Adjusting...',
  'results.showMore': 'Show more...',
  'results.example': 'Example',
  'results.casual': 'Make it casual',
  'results.polite': 'Make it polite',
  'results.neutral': 'Make it neutral',
  'results.catchy': 'Make it catchy',
  'results.concise': 'Make it shorter',
  'results.detailed': 'Make it detailed',
  'results.natural': 'Make it natural',
  'results.lessAI': 'Less AI-like',
  'results.alternative': 'Alternative phrasing',
  'results.explanation': 'Explanation',
  'auth.connect': 'Connect OpenRouter',
  'auth.success': 'Successfully connected!',
  'auth.redirecting': 'Redirecting...',
  'auth.error': 'Authentication failed',
}

// Japanese translations
const ja: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': 'あたらしく翻訳',
  'sidebar.quickSelect': 'クイック選択',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': '未接続',
  'settings.title': '設定',
  'settings.description': '翻訳の設定をカスタマイズ',
  'settings.systemLanguage': 'システム言語',
  'settings.systemLanguageDesc': 'UIの言語と翻訳のデフォルト対象言語',
  'settings.translationModel': '翻訳モデル',
  'settings.nativeLanguage': '母国語',
  'settings.keyboardShortcuts': 'キーボードショートカット',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Enter で翻訳',
  'settings.saveHistory': '履歴を保存',
  'settings.saveHistoryDesc': '翻訳をローカルに保存',
  'settings.translationHistory': '翻訳履歴',
  'settings.historyStorageDesc': 'IndexedDBにgzip圧縮で保存されています',
  'settings.clearAllHistory': '履歴をすべて削除',
  'settings.clearHistoryConfirm': '翻訳履歴をすべて削除しますか？',
  'settings.contextTokens': 'コンテキスト',
  'settings.fast': '高速',
  'settings.balanced': 'バランス',
  'settings.advanced': '高性能',
  'input.placeholder': '翻訳するテキストを入力...',
  'input.translate': '翻訳する',
  'input.translating': '翻訳中...',
  'input.retranslate': '再翻訳',
  'input.editInput': '入力を編集',
  'input.connectProvider': '翻訳するにはLLMプロバイダーを接続してください',
  'input.inputLabel': '翻訳テキストを入力',
  'input.autoDetect': '自動検出',
  'input.translateOther': '別のテキストを翻訳',
  'input.aiHelper': 'AIが言語を検出し、複数のスタイルで翻訳を提案します',
  'results.copied': 'コピーしました！',
  'results.copy': 'コピー',
  'results.speak': '読み上げ',
  'results.backTranslate': '逆翻訳',
  'results.backTranslating': '逆翻訳中...',
  'results.backTo': '戻すと...',
  'results.translatedOne': '翻訳しました',
  'results.translatedMany': '{count}パターンの翻訳を考えました',
  'results.adjust': '調整',
  'results.adjusting': '調整中...',
  'results.showMore': 'もっと見る...',
  'results.example': '例文',
  'results.casual': 'カジュアルに',
  'results.polite': 'ていねいに',
  'results.neutral': '淡々と',
  'results.catchy': 'キャッチーに',
  'results.concise': 'もう少し短く',
  'results.detailed': 'より詳しく',
  'results.natural': 'ネイティブらしく自然に',
  'results.lessAI': 'AIっぽさを消して',
  'results.alternative': '他の言い方は？',
  'results.explanation': '解説',
  'auth.connect': 'OpenRouter を接続',
  'auth.success': '接続に成功しました！',
  'auth.redirecting': 'リダイレクト中...',
  'auth.error': '認証に失敗しました',
}

// Chinese Simplified translations
const zhCN: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': '新建翻译',
  'sidebar.quickSelect': '快速选择',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': '未连接',
  'settings.title': '设置',
  'settings.description': '自定义翻译设置',
  'settings.systemLanguage': '系统语言',
  'settings.systemLanguageDesc': 'UI语言和默认翻译目标',
  'settings.translationModel': '翻译模型',
  'settings.nativeLanguage': '母语',
  'settings.keyboardShortcuts': '键盘快捷键',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Enter 翻译',
  'settings.saveHistory': '保存历史',
  'settings.saveHistoryDesc': '本地存储翻译',
  'settings.translationHistory': '翻译历史',
  'settings.historyStorageDesc': '使用gzip压缩存储在IndexedDB中',
  'settings.clearAllHistory': '清除所有历史',
  'settings.clearHistoryConfirm': '删除所有翻译历史？',
  'settings.contextTokens': '上下文',
  'settings.fast': '快速',
  'settings.balanced': '平衡',
  'settings.advanced': '高级',
  'input.placeholder': '输入要翻译的文本...',
  'input.translate': '翻译',
  'input.translating': '翻译中...',
  'input.retranslate': '重新翻译',
  'input.editInput': '编辑输入',
  'input.connectProvider': '连接LLM提供商以进行翻译',
  'input.inputLabel': '输入翻译文本',
  'input.autoDetect': '自动检测',
  'input.translateOther': '翻译其他文本',
  'input.aiHelper': 'AI将检测语言并以多种风格建议翻译',
  'results.copied': '已复制！',
  'results.copy': '复制',
  'results.speak': '朗读',
  'results.backTranslate': '回译',
  'results.backTranslating': '回译中...',
  'results.backTo': '回译为...',
  'results.translatedOne': '翻译完成',
  'results.translatedMany': '生成了{count}种翻译变体',
  'results.adjust': '调整',
  'results.adjusting': '调整中...',
  'results.showMore': '显示更多...',
  'results.example': '例句',
  'results.casual': '随意一些',
  'results.polite': '礼貌一些',
  'results.neutral': '中性一些',
  'results.catchy': '更吸引人',
  'results.concise': '更简短',
  'results.detailed': '更详细',
  'results.natural': '更自然',
  'results.lessAI': '减少AI感',
  'results.alternative': '其他表达方式',
  'results.explanation': '说明',
  'auth.connect': '连接 OpenRouter',
  'auth.success': '连接成功！',
  'auth.redirecting': '重定向中...',
  'auth.error': '认证失败',
}

// Korean translations
const ko: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': '새 번역',
  'sidebar.quickSelect': '빠른 선택',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': '연결 안 됨',
  'settings.title': '설정',
  'settings.description': '번역 설정 사용자 정의',
  'settings.systemLanguage': '시스템 언어',
  'settings.systemLanguageDesc': 'UI 언어 및 기본 번역 대상',
  'settings.translationModel': '번역 모델',
  'settings.nativeLanguage': '모국어',
  'settings.keyboardShortcuts': '키보드 단축키',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Enter로 번역',
  'settings.saveHistory': '기록 저장',
  'settings.saveHistoryDesc': '로컬에 번역 저장',
  'settings.translationHistory': '번역 기록',
  'settings.historyStorageDesc': 'IndexedDB에 gzip 압축으로 저장됨',
  'settings.clearAllHistory': '모든 기록 삭제',
  'settings.clearHistoryConfirm': '모든 번역 기록을 삭제하시겠습니까?',
  'settings.contextTokens': '컨텍스트',
  'settings.fast': '빠름',
  'settings.balanced': '균형',
  'settings.advanced': '고급',
  'input.placeholder': '번역할 텍스트 입력...',
  'input.translate': '번역',
  'input.translating': '번역 중...',
  'input.retranslate': '다시 번역',
  'input.editInput': '입력 수정',
  'input.connectProvider': 'LLM 제공업체를 연결하여 번역하세요',
  'input.inputLabel': '번역할 텍스트 입력',
  'input.autoDetect': '자동 감지',
  'input.translateOther': '다른 텍스트 번역',
  'input.aiHelper': 'AI가 언어를 감지하고 여러 스타일로 번역을 제안합니다',
  'results.copied': '복사됨!',
  'results.copy': '복사',
  'results.speak': '읽기',
  'results.backTranslate': '역번역',
  'results.backTranslating': '역번역 중...',
  'results.backTo': '역번역 결과...',
  'results.translatedOne': '번역 완료',
  'results.translatedMany': '{count}가지 번역 변형 생성',
  'results.adjust': '조정',
  'results.adjusting': '조정 중...',
  'results.showMore': '더 보기...',
  'results.example': '예문',
  'results.casual': '캐주얼하게',
  'results.polite': '정중하게',
  'results.neutral': '중립적으로',
  'results.catchy': '눈에 띄게',
  'results.concise': '더 짧게',
  'results.detailed': '더 자세하게',
  'results.natural': '더 자연스럽게',
  'results.lessAI': 'AI 느낌 줄이기',
  'results.alternative': '다른 표현',
  'results.explanation': '설명',
  'auth.connect': 'OpenRouter 연결',
  'auth.success': '연결 성공!',
  'auth.redirecting': '리디렉션 중...',
  'auth.error': '인증 실패',
}

// Spanish translations
const es: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': 'Nueva traducción',
  'sidebar.quickSelect': 'Selección rápida',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': 'No conectado',
  'settings.title': 'Configuración',
  'settings.description': 'Personalizar ajustes de traducción',
  'settings.systemLanguage': 'Idioma del sistema',
  'settings.systemLanguageDesc': 'Idioma de la UI y objetivo de traducción predeterminado',
  'settings.translationModel': 'Modelo de traducción',
  'settings.nativeLanguage': 'Idioma nativo',
  'settings.keyboardShortcuts': 'Atajos de teclado',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Enter para traducir',
  'settings.saveHistory': 'Guardar historial',
  'settings.saveHistoryDesc': 'Almacenar traducciones localmente',
  'settings.translationHistory': 'Historial de traducción',
  'settings.historyStorageDesc': 'Almacenado con compresión gzip en IndexedDB',
  'settings.clearAllHistory': 'Borrar todo el historial',
  'settings.clearHistoryConfirm': '¿Eliminar todo el historial de traducción?',
  'settings.contextTokens': 'Contexto',
  'settings.fast': 'Rápido',
  'settings.balanced': 'Equilibrado',
  'settings.advanced': 'Avanzado',
  'input.placeholder': 'Ingrese texto para traducir...',
  'input.translate': 'Traducir',
  'input.translating': 'Traduciendo...',
  'input.retranslate': 'Retraducir',
  'input.editInput': 'Editar entrada',
  'input.connectProvider': 'Conecte un proveedor LLM para traducir',
  'input.inputLabel': 'Ingrese texto para traducir',
  'input.autoDetect': 'Detectar automáticamente',
  'input.translateOther': 'Traducir otro texto',
  'input.aiHelper': 'La IA detectará el idioma y sugerirá traducciones en múltiples estilos',
  'results.copied': '¡Copiado!',
  'results.copy': 'Copiar',
  'results.speak': 'Leer',
  'results.backTranslate': 'Traducción inversa',
  'results.backTranslating': 'Traduciendo inversamente...',
  'results.backTo': 'Se traduce inversamente a...',
  'results.translatedOne': 'Traducción completa',
  'results.translatedMany': 'Se generaron {count} variantes de traducción',
  'results.adjust': 'Ajustar',
  'results.adjusting': 'Ajustando...',
  'results.showMore': 'Mostrar más...',
  'results.example': 'Ejemplo',
  'results.casual': 'Más casual',
  'results.polite': 'Más formal',
  'results.neutral': 'Más neutral',
  'results.catchy': 'Más llamativo',
  'results.concise': 'Más corto',
  'results.detailed': 'Más detallado',
  'results.natural': 'Más natural',
  'results.lessAI': 'Menos IA',
  'results.alternative': 'Frase alternativa',
  'results.explanation': 'Explicación',
  'auth.connect': 'Conectar OpenRouter',
  'auth.success': '¡Conectado exitosamente!',
  'auth.redirecting': 'Redirigiendo...',
  'auth.error': 'Autenticación fallida',
}

// French translations
const fr: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': 'Nouvelle traduction',
  'sidebar.quickSelect': 'Sélection rapide',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': 'Non connecté',
  'settings.title': 'Paramètres',
  'settings.description': 'Personnaliser les paramètres de traduction',
  'settings.systemLanguage': 'Langue du système',
  'settings.systemLanguageDesc': 'Langue de l\'interface et cible de traduction par défaut',
  'settings.translationModel': 'Modèle de traduction',
  'settings.nativeLanguage': 'Langue maternelle',
  'settings.keyboardShortcuts': 'Raccourcis clavier',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Entrée pour traduire',
  'settings.saveHistory': 'Sauvegarder l\'historique',
  'settings.saveHistoryDesc': 'Stocker les traductions localement',
  'settings.translationHistory': 'Historique des traductions',
  'settings.historyStorageDesc': 'Stocké avec compression gzip dans IndexedDB',
  'settings.clearAllHistory': 'Effacer tout l\'historique',
  'settings.clearHistoryConfirm': 'Supprimer tout l\'historique de traduction ?',
  'settings.contextTokens': 'Contexte',
  'settings.fast': 'Rapide',
  'settings.balanced': 'Équilibré',
  'settings.advanced': 'Avancé',
  'input.placeholder': 'Entrez le texte à traduire...',
  'input.translate': 'Traduire',
  'input.translating': 'Traduction...',
  'input.retranslate': 'Retraduire',
  'input.editInput': 'Modifier l\'entrée',
  'input.connectProvider': 'Connectez un fournisseur LLM pour traduire',
  'input.inputLabel': 'Entrez le texte à traduire',
  'input.autoDetect': 'Détection automatique',
  'input.translateOther': 'Traduire un autre texte',
  'input.aiHelper': 'L\'IA détectera la langue et proposera des traductions dans plusieurs styles',
  'results.copied': 'Copié !',
  'results.copy': 'Copier',
  'results.speak': 'Lire',
  'results.backTranslate': 'Rétro-traduction',
  'results.backTranslating': 'Rétro-traduction...',
  'results.backTo': 'Se rétro-traduit en...',
  'results.translatedOne': 'Traduction terminée',
  'results.translatedMany': '{count} variantes de traduction générées',
  'results.adjust': 'Ajuster',
  'results.adjusting': 'Ajustement...',
  'results.showMore': 'Voir plus...',
  'results.example': 'Exemple',
  'results.casual': 'Plus décontracté',
  'results.polite': 'Plus formel',
  'results.neutral': 'Plus neutre',
  'results.catchy': 'Plus accrocheur',
  'results.concise': 'Plus court',
  'results.detailed': 'Plus détaillé',
  'results.natural': 'Plus naturel',
  'results.lessAI': 'Moins IA',
  'results.alternative': 'Formulation alternative',
  'results.explanation': 'Explication',
  'auth.connect': 'Connecter OpenRouter',
  'auth.success': 'Connecté avec succès !',
  'auth.redirecting': 'Redirection...',
  'auth.error': 'Échec de l\'authentification',
}

// German translations
const de: TranslationDict = {
  'app.name': 'Nanya',
  'app.newTranslation': 'Neue Übersetzung',
  'sidebar.quickSelect': 'Schnellauswahl',
  'sidebar.connected': 'OpenRouter',
  'sidebar.notConnected': 'Nicht verbunden',
  'settings.title': 'Einstellungen',
  'settings.description': 'Übersetzungseinstellungen anpassen',
  'settings.systemLanguage': 'Systemsprache',
  'settings.systemLanguageDesc': 'UI-Sprache und Standard-Übersetzungsziel',
  'settings.translationModel': 'Übersetzungsmodell',
  'settings.nativeLanguage': 'Muttersprache',
  'settings.keyboardShortcuts': 'Tastenkürzel',
  'settings.keyboardShortcutsDesc': 'Cmd/Ctrl + Enter zum Übersetzen',
  'settings.saveHistory': 'Verlauf speichern',
  'settings.saveHistoryDesc': 'Übersetzungen lokal speichern',
  'settings.translationHistory': 'Übersetzungsverlauf',
  'settings.historyStorageDesc': 'Mit gzip-Komprimierung in IndexedDB gespeichert',
  'settings.clearAllHistory': 'Gesamten Verlauf löschen',
  'settings.clearHistoryConfirm': 'Gesamten Übersetzungsverlauf löschen?',
  'settings.contextTokens': 'Kontext',
  'settings.fast': 'Schnell',
  'settings.balanced': 'Ausgewogen',
  'settings.advanced': 'Erweitert',
  'input.placeholder': 'Text zum Übersetzen eingeben...',
  'input.translate': 'Übersetzen',
  'input.translating': 'Übersetze...',
  'input.retranslate': 'Neu übersetzen',
  'input.editInput': 'Eingabe bearbeiten',
  'input.connectProvider': 'Verbinden Sie einen LLM-Anbieter zum Übersetzen',
  'input.inputLabel': 'Text zum Übersetzen eingeben',
  'input.autoDetect': 'Automatische Erkennung',
  'input.translateOther': 'Anderen Text übersetzen',
  'input.aiHelper': 'KI erkennt die Sprache und schlägt Übersetzungen in mehreren Stilen vor',
  'results.copied': 'Kopiert!',
  'results.copy': 'Kopieren',
  'results.speak': 'Vorlesen',
  'results.backTranslate': 'Rückübersetzung',
  'results.backTranslating': 'Rückübersetze...',
  'results.backTo': 'Rückübersetzt zu...',
  'results.translatedOne': 'Übersetzung abgeschlossen',
  'results.translatedMany': '{count} Übersetzungsvarianten generiert',
  'results.adjust': 'Anpassen',
  'results.adjusting': 'Anpassung...',
  'results.showMore': 'Mehr anzeigen...',
  'results.example': 'Beispiel',
  'results.casual': 'Lockerer',
  'results.polite': 'Förmlicher',
  'results.neutral': 'Neutraler',
  'results.catchy': 'Einprägsamer',
  'results.concise': 'Kürzer',
  'results.detailed': 'Detaillierter',
  'results.natural': 'Natürlicher',
  'results.lessAI': 'Weniger KI',
  'results.alternative': 'Alternative Formulierung',
  'results.explanation': 'Erklärung',
  'auth.connect': 'OpenRouter verbinden',
  'auth.success': 'Erfolgreich verbunden!',
  'auth.redirecting': 'Weiterleitung...',
  'auth.error': 'Authentifizierung fehlgeschlagen',
}

// All translations
const translations: Partial<Record<LanguageCode, TranslationDict>> = {
  en,
  ja,
  'zh-CN': zhCN,
  ko,
  es,
  fr,
  de,
}

// Get translation function
export function getTranslation(lang: LanguageCode, key: UITextKey): string {
  const dict = translations[lang] || translations['en']
  return dict?.[key] || translations['en']![key] || key
}

// Hook-friendly translation getter
export function createT(lang: LanguageCode) {
  return (key: UITextKey): string => getTranslation(lang, key)
}

// Get language info
export function getLanguageInfo(code: LanguageCode) {
  return SUPPORTED_LANGUAGES[code]
}

// Get all language codes
export function getAllLanguageCodes(): LanguageCode[] {
  return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]
}

// Detect browser language
export function detectBrowserLanguage(): LanguageCode {
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en'
  const code = browserLang.split('-')[0] as LanguageCode

  // Check for exact match first
  if (SUPPORTED_LANGUAGES[browserLang as LanguageCode]) {
    return browserLang as LanguageCode
  }

  // Then check base language
  if (SUPPORTED_LANGUAGES[code]) {
    return code
  }

  return 'en'
}
