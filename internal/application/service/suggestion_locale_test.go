package service

import (
	"testing"

	"github.com/Tencent/WeKnora/internal/types"
)

func TestWikiSuggestionFollowsUILocale(t *testing.T) {
	concept := &types.WikiPage{Title: "Trình dựng workflow trực quan", PageType: types.WikiPageTypeConcept}
	entity := &types.WikiPage{Title: "obra/superpowers", PageType: types.WikiPageTypeEntity}
	summary := &types.WikiPage{Title: "10-OpenMausBot---Open-source-Grok-Bot-alternative.md - Summary", PageType: types.WikiPageTypeSummary}
	zhConcept := &types.WikiPage{Title: "检索增强生成", PageType: types.WikiPageTypeConcept}

	cases := []struct {
		page   *types.WikiPage
		locale string
		want   string
	}{
		{concept, "vi-VN", "Trình dựng workflow trực quan là gì?"},
		{concept, "en-US", ""}, // Vietnamese title hidden from an English UI
		{entity, "vi-VN", "Giới thiệu về obra/superpowers"},
		{entity, "en-US", "Tell me about obra/superpowers"},
		{entity, "ja-JP", "obra/superpowersについて教えてください"},
		{summary, "en-US", "Tell me about OpenMausBot — Open source Grok Bot alternative"},
		{zhConcept, "zh-CN", "什么是检索增强生成？"},
		{zhConcept, "vi-VN", ""},
	}
	for _, c := range cases {
		if got := wikiSuggestionFromPage(c.page, c.locale); got != c.want {
			t.Errorf("%q @%s = %q, want %q", c.page.Title, c.locale, got, c.want)
		}
	}
}

func TestSuggestionMatchesLocale(t *testing.T) {
	cases := []struct {
		text, locale string
		want         bool
	}{
		{"Chính sách phụ cấp gồm những khoản nào?", "vi-VN", true},
		{"Chính sách phụ cấp gồm những khoản nào?", "en-US", false},
		{"什么是RAG？", "vi-VN", false},
		{"What is RAG?", "vi-VN", true},
		{"Dự án phát triển WordPress (CIパブクラ開発)", "vi-VN", true},
		{"PO-FT24-0016", "ko-KR", true},
		{"RAGとは？", "ja-JP", true},
	}
	for _, c := range cases {
		if got := suggestionMatchesLocale(c.text, c.locale); got != c.want {
			t.Errorf("%q @%s = %v, want %v", c.text, c.locale, got, c.want)
		}
	}
}

func TestReadableWikiTitleKeepsCodes(t *testing.T) {
	if got := readableWikiTitle("PO-FT24-0016.md - Summary"); got != "PO-FT24-0016" {
		t.Fatalf("got %q", got)
	}
}
