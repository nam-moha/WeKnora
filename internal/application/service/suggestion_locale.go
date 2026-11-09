package service

import (
	"regexp"
	"strings"
	"unicode"
)

// Suggestion chips are shown in the caller's UI language. Wiki-page chips are
// built from a per-language template; every chip (wiki, FAQ, generated
// document question) is dropped when its text is plainly in another script,
// so a Vietnamese or English UI never shows "什么是…？" style chips.

type suggestionTemplates struct {
	concept string // %s = page title
	about   string // entity / summary pages
}

var suggestionTemplatesByLang = map[string]suggestionTemplates{
	"en":    {"What is %s?", "Tell me about %s"},
	"vi":    {"%s là gì?", "Giới thiệu về %s"},
	"zh":    {"什么是%s？", "介绍一下%s"},
	"zh-TW": {"什麼是%s？", "介紹一下%s"},
	"ja":    {"%sとは何ですか？", "%sについて教えてください"},
	"ko":    {"%s(이)란 무엇인가요?", "%s에 대해 알려 주세요"},
	"ru":    {"Что такое %s?", "Расскажите о %s"},
}

// suggestionLangKey maps a locale tag to a key of suggestionTemplatesByLang.
func suggestionLangKey(locale string) string {
	l := strings.ToLower(strings.TrimSpace(locale))
	switch {
	case l == "zh-tw" || l == "zh-hk" || l == "zh-mo" || strings.HasPrefix(l, "zh-hant"):
		return "zh-TW"
	case strings.HasPrefix(l, "zh"):
		return "zh"
	case strings.HasPrefix(l, "vi"):
		return "vi"
	case strings.HasPrefix(l, "ja"):
		return "ja"
	case strings.HasPrefix(l, "ko"):
		return "ko"
	case strings.HasPrefix(l, "ru"):
		return "ru"
	default:
		return "en"
	}
}

func suggestionTemplatesFor(locale string) suggestionTemplates {
	return suggestionTemplatesByLang[suggestionLangKey(locale)]
}

// Vietnamese-only letters: đ ơ ư ă plus the Latin Extended Additional block
// (ạ ả ấ … ỹ) that carries Vietnamese tone marks.
func isVietnameseRune(r rune) bool {
	switch unicode.ToLower(r) {
	case 'đ', 'ơ', 'ư', 'ă':
		return true
	}
	return r >= 0x1EA0 && r <= 0x1EF9
}

// textScript classifies text by its dominant script: "latin" (plain Latin,
// e.g. English or names), "vi", "zh", "ja", "ko", "ru", or "" (no letters).
func textScript(s string) string {
	var latin, han, kana, hangul, cyr int
	viet := false
	for _, r := range s {
		switch {
		case unicode.Is(unicode.Hiragana, r) || unicode.Is(unicode.Katakana, r):
			kana++
		case unicode.Is(unicode.Han, r):
			han++
		case unicode.Is(unicode.Hangul, r):
			hangul++
		case unicode.Is(unicode.Cyrillic, r):
			cyr++
		case unicode.Is(unicode.Latin, r):
			latin++
			if isVietnameseRune(r) {
				viet = true
			}
		}
	}
	// One CJK or Hangul character carries roughly a word, so it outweighs a
	// Latin letter: "什么是RAG？" is Chinese, not Latin.
	cjk := (han + kana) * 3
	hangul *= 3
	switch {
	case latin == 0 && cjk == 0 && hangul == 0 && cyr == 0:
		return ""
	case latin >= cjk && latin >= hangul && latin >= cyr:
		if viet {
			return "vi"
		}
		return "latin"
	case cjk >= hangul && cjk >= cyr:
		if kana > 0 {
			return "ja"
		}
		return "zh"
	case hangul >= cyr:
		return "ko"
	default:
		return "ru"
	}
}

// suggestionMatchesLocale reports whether text can be shown to a UI in locale.
// Plain Latin text (names, product terms, ASCII titles) fits every UI; other
// scripts must match the UI language. Japanese UIs also accept kanji-only text.
func suggestionMatchesLocale(text, locale string) bool {
	script := textScript(text)
	if script == "" || script == "latin" {
		return true
	}
	switch suggestionLangKey(locale) {
	case "vi":
		return script == "vi"
	case "zh", "zh-TW":
		return script == "zh"
	case "ja":
		return script == "ja" || script == "zh"
	case "ko":
		return script == "ko"
	case "ru":
		return script == "ru"
	default:
		return false
	}
}

var (
	summaryTitleSuffix = regexp.MustCompile(`\s+-\s+Summary$`)
	fileExtSuffix      = regexp.MustCompile(`(?i)\.(md|markdown|txt|pdf|docx?|xlsx?|csv|pptx?|html?)$`)
	leadingIndex       = regexp.MustCompile(`^\d+[-_.\s]+`)
	tripleDash         = regexp.MustCompile(`-{2,}`)
)

// readableWikiTitle turns a summary page title derived from a file name
// ("07-agency-agents---A-complete-AI-agency.md - Summary") into a readable
// topic ("agency agents — A complete AI agency"). Codes such as
// "PO-FT24-0016" keep their hyphens.
func readableWikiTitle(title string) string {
	t := strings.TrimSpace(summaryTitleSuffix.ReplaceAllString(title, ""))
	t = fileExtSuffix.ReplaceAllString(t, "")
	if strings.Contains(t, " ") {
		return strings.TrimSpace(t)
	}
	if !strings.ContainsFunc(t, unicode.IsLower) {
		return t // an identifier like PO-FT24-0016
	}
	t = leadingIndex.ReplaceAllString(t, "")
	t = tripleDash.ReplaceAllString(t, " — ")
	t = strings.NewReplacer("-", " ", "_", " ").Replace(t)
	return strings.Join(strings.Fields(t), " ")
}
