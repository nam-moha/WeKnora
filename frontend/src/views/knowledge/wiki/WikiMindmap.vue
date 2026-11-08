<template>
  <div class="wiki-mindmap">
    <div class="wiki-mindmap-toolbar">
      <t-radio-group v-model="mode" size="small">
        <t-radio-button value="overview">{{ t('mindmap.overview') }}</t-radio-button>
        <t-radio-button value="page">{{ t('mindmap.byPage') }}</t-radio-button>
      </t-radio-group>

      <t-select v-if="mode === 'page'" v-model="pageSlug" class="wiki-mindmap-page-select" size="small" filterable
        :options="pageOptions" :placeholder="t('mindmap.pickPage')" :popup-props="{ zIndex: 100 }" />

      <t-select v-model="expandLevel" class="wiki-mindmap-level" size="small" :options="levelOptions"
        :popup-props="{ zIndex: 100 }" />

      <div class="wiki-mindmap-toolbar-spacer" />

      <t-button v-if="mode === 'page' && pageSlug" size="small" variant="text" @click="emit('open-wiki', pageSlug)">
        <template #icon><t-icon name="jump" /></template>
        {{ t('mindmap.openInWiki') }}
      </t-button>
      <t-button size="small" variant="text" :disabled="!markdown" @click="fit">
        <template #icon><t-icon name="fullscreen-2" /></template>
        {{ t('mindmap.fit') }}
      </t-button>
      <t-button size="small" variant="text" :disabled="!markdown" @click="download('md')">
        <template #icon><t-icon name="download" /></template>
        Markdown
      </t-button>
      <t-button size="small" variant="text" :disabled="!markdown" @click="download('svg')">
        <template #icon><t-icon name="download" /></template>
        SVG
      </t-button>
    </div>

    <div class="wiki-mindmap-body" @click.capture="onCanvasClick">
      <svg ref="svgRef" class="wiki-mindmap-canvas" />
      <div v-if="loading" class="wiki-mindmap-overlay"><t-loading size="small" :text="t('mindmap.loading')" /></div>
      <div v-else-if="!markdown" class="wiki-mindmap-overlay">
        <t-empty :description="mode === 'page' && !pageSlug ? t('mindmap.pickPage') : t('mindmap.empty')" />
      </div>
    </div>
    <div class="wiki-mindmap-hint">{{ t('mindmap.hint') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Markmap } from 'markmap-view'
import { getWikiIndex, getWikiPage, type WikiIndexEntryDTO, type WikiIndexGroup, type WikiPage } from '@/api/wiki'
import { createMarkmap, markmapSvgMarkup, updateMarkmap } from '@/utils/markmapShared'
import {
  buildOverviewMarkdown,
  buildPageMarkdown,
  displayTitle,
  MINDMAP_PAGE_TYPES,
  type MindmapEntry,
} from './wikiMindmapMarkdown'

const props = defineProps<{ knowledgeBaseId: string; kbName?: string }>()
const emit = defineEmits<{ (e: 'open-wiki', slug: string): void }>()

const { t } = useI18n()
const route = useRoute()

const svgRef = ref<SVGSVGElement | null>(null)
const mode = ref<'overview' | 'page'>(typeof route.query.slug === 'string' ? 'page' : 'overview')
const pageSlug = ref<string>(typeof route.query.slug === 'string' ? route.query.slug : '')
const expandLevel = ref<number>(3)
const loading = ref(false)
const markdown = ref('')
const entries = ref<MindmapEntry[]>([])
let mm: Markmap | null = null
let renderSeq = 0

const levelOptions = computed(() => [
  { value: 1, label: t('mindmap.level', { n: 1 }) },
  { value: 2, label: t('mindmap.level', { n: 2 }) },
  { value: 3, label: t('mindmap.level', { n: 3 }) },
  { value: -1, label: t('mindmap.levelAll') },
])

const titleBySlug = computed(() => {
  const map = new Map<string, string>()
  for (const e of entries.value) map.set(e.slug, displayTitle(e))
  return map
})

const pageOptions = computed(() =>
  entries.value
    .map(e => ({ value: e.slug, label: `${displayTitle(e)} · ${typeLabel(e.type)}` }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)

function typeLabel(type: string) {
  const key = {
    summary: 'filterSummary',
    entity: 'filterEntity',
    concept: 'filterConcept',
    synthesis: 'filterSynthesis',
    comparison: 'filterComparison',
  }[type]
  return key ? t(`knowledgeEditor.wikiBrowser.${key}`) : type
}

async function loadEntries() {
  const all: MindmapEntry[] = []
  for (const type of MINDMAP_PAGE_TYPES) {
    let cursor: string | undefined
    // Every bucket is paged: the index endpoint caps a window at 200 items.
    for (let guard = 0; guard < 100; guard++) {
      const res = await getWikiIndex(props.knowledgeBaseId, { types: [type], limit: 200, cursor })
      const body: any = (res as any).data || res
      const group = (body?.groups || []).find((g: WikiIndexGroup) => g.type === type)
      const items: WikiIndexEntryDTO[] = group?.items || []
      all.push(...items.map(i => ({ ...i, type })))
      cursor = group?.next_cursor
      if (!cursor || items.length === 0) break
    }
  }
  entries.value = all
}

async function buildMarkdown(): Promise<string> {
  if (mode.value === 'overview') {
    return buildOverviewMarkdown(props.kbName || 'Wiki', entries.value, typeLabel)
  }
  if (!pageSlug.value) return ''
  const res = await getWikiPage(props.knowledgeBaseId, pageSlug.value)
  const page = ((res as any).data || res) as WikiPage
  return buildPageMarkdown(page, titleBySlug.value, {
    outLinks: t('mindmap.links'),
    inLinks: t('mindmap.backlinks'),
  })
}

async function render() {
  const seq = ++renderSeq
  loading.value = true
  try {
    if (entries.value.length === 0) await loadEntries()
    const md = await buildMarkdown()
    if (seq !== renderSeq) return
    markdown.value = md
    if (!md || !svgRef.value) return
    const opts = { initialExpandLevel: expandLevel.value }
    if (mm) await updateMarkmap(mm, md, opts)
    else mm = await createMarkmap(svgRef.value, md, opts)
  } catch (e) {
    console.error('Failed to build wiki mindmap:', e)
    if (seq === renderSeq) markdown.value = ''
  } finally {
    if (seq === renderSeq) loading.value = false
  }
}

function fit() {
  void mm?.fit()
}

// Page links inside nodes are `#wiki:<slug>`: clicking one drills the mind map
// into that page instead of navigating the browser.
function onCanvasClick(ev: MouseEvent) {
  const a = (ev.target as HTMLElement | null)?.closest?.('a')
  const href = a?.getAttribute('href') || ''
  if (!href.startsWith('#wiki:')) return
  ev.preventDefault()
  ev.stopPropagation()
  pageSlug.value = decodeURIComponent(href.slice('#wiki:'.length))
  mode.value = 'page'
}

function download(kind: 'md' | 'svg') {
  const base = mode.value === 'page' && pageSlug.value
    ? (titleBySlug.value.get(pageSlug.value) || pageSlug.value)
    : (props.kbName || 'wiki')
  const name = `${base}`.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80) || 'mindmap'
  const content = kind === 'md' ? markdown.value : (svgRef.value ? markmapSvgMarkup(svgRef.value) : '')
  if (!content) return
  const blob = new Blob([content], { type: kind === 'md' ? 'text/markdown;charset=utf-8' : 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.mindmap.${kind}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

watch([mode, pageSlug, expandLevel], () => { void render() })
watch(() => props.knowledgeBaseId, () => {
  entries.value = []
  void render()
})

onMounted(() => { void render() })
onBeforeUnmount(() => {
  mm?.destroy()
  mm = null
})
</script>

<style scoped lang="less">
.wiki-mindmap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0 4px 8px;
}

.wiki-mindmap-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 0 10px;
}

.wiki-mindmap-page-select {
  width: min(420px, 100%);
}

.wiki-mindmap-level {
  width: 120px;
}

.wiki-mindmap-toolbar-spacer {
  flex: 1;
}

.wiki-mindmap-body {
  position: relative;
  flex: 1;
  min-height: 420px;
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--app-radius-lg, 8px);
  background: var(--td-bg-color-container);
  overflow: hidden;
}

.wiki-mindmap-canvas {
  display: block;
  width: 100%;
  height: 100%;
  color: var(--td-text-color-primary);
  --markmap-text-color: var(--td-text-color-primary);
  --markmap-a-color: var(--td-brand-color);
  --markmap-a-hover-color: var(--td-brand-color-hover);
  --markmap-code-bg: var(--td-bg-color-secondarycontainer);
  --markmap-code-color: var(--td-text-color-secondary);
}

.wiki-mindmap-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--td-bg-color-container) 70%, transparent);
}

.wiki-mindmap-hint {
  padding-top: 6px;
  font-size: var(--app-text-sm, 12px);
  color: var(--td-text-color-placeholder);
}
</style>
