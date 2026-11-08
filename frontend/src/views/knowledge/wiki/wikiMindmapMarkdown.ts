import type { WikiIndexEntryDTO, WikiPage } from '@/api/wiki'

// Builds the Markdown outlines that markmap turns into mind maps. Pure
// functions so the tree shape can be unit-tested without a DOM.

export const MINDMAP_PAGE_TYPES = ['summary', 'entity', 'concept', 'synthesis', 'comparison'] as const

export interface MindmapEntry extends WikiIndexEntryDTO {
  type: string
}

const MAX_LABEL = 120
const MAX_TABLE_ROWS = 25
const MAX_LINKS = 30
export const PAGE_CHUNK = 20

function clip(text: string, max = MAX_LABEL): string {
  const s = text.replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

// Markdown link text must not break the outline: brackets and pipes are the
// only characters that change how markmap parses a label.
function linkText(text: string): string {
  return clip(text).replace(/[[\]]/g, '').replace(/\|/g, '/')
}

function pageLink(slug: string, title: string): string {
  return `[${linkText(title)}](#wiki:${encodeURIComponent(slug)})`
}

/** Summary pages are titled "<file> - Summary"; the file stem reads better. */
export function displayTitle(entry: { title: string; type?: string; page_type?: string }): string {
  const type = entry.type || entry.page_type
  let title = entry.title || ''
  if (type === 'summary') {
    title = title.replace(/\s*-\s*Summary$/i, '').replace(/\.(md|pdf|docx?|txt|xlsx?|csv|pptx?)$/i, '')
  }
  return title.trim() || '(untitled)'
}

interface CategoryNode {
  name: string
  pages: MindmapEntry[]
  children: Map<string, CategoryNode>
}

function newNode(name: string): CategoryNode {
  return { name, pages: [], children: new Map() }
}

function countPages(node: CategoryNode): number {
  let n = node.pages.length
  for (const c of node.children.values()) n += countPages(c)
  return n
}

// Pages are emitted before sub-categories: in a markmap outline an item that
// follows a nested list would otherwise read as a sibling of the last folder.
function emitCategory(node: CategoryNode, depth: number, out: string[]) {
  const indent = '  '.repeat(depth)
  const pages = [...node.pages].sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
  if (pages.length > PAGE_CHUNK) {
    // A flat fan of 75 leaves is unreadable; bucket them into sorted ranges.
    for (let i = 0; i < pages.length; i += PAGE_CHUNK) {
      const chunk = pages.slice(i, i + PAGE_CHUNK)
      const first = displayTitle(chunk[0])
      const last = displayTitle(chunk[chunk.length - 1])
      out.push(`${indent}- ${linkText(first === last ? first : `${first} … ${last}`)} (${chunk.length})`)
      for (const p of chunk) out.push(`${indent}  - ${pageLink(p.slug, displayTitle(p))}`)
    }
  } else {
    for (const p of pages) out.push(`${indent}- ${pageLink(p.slug, displayTitle(p))}`)
  }
  const cats = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name))
  for (const c of cats) {
    out.push(`${indent}- **${linkText(c.name)}** (${countPages(c)})`)
    emitCategory(c, depth + 1, out)
  }
}

export function buildOverviewMarkdown(
  kbName: string,
  entries: MindmapEntry[],
  typeLabel: (type: string) => string,
): string {
  if (entries.length === 0) return ''
  const out: string[] = [`# ${linkText(kbName)}`, '']
  for (const type of MINDMAP_PAGE_TYPES) {
    const ofType = entries.filter(e => e.type === type)
    if (ofType.length === 0) continue
    const root = newNode(type)
    for (const e of ofType) {
      let node = root
      for (const part of (e.category_path || []).filter(Boolean)) {
        if (!node.children.has(part)) node.children.set(part, newNode(part))
        node = node.children.get(part)!
      }
      node.pages.push(e)
    }
    out.push(`## ${typeLabel(type)} (${ofType.length})`, '')
    emitCategory(root, 0, out)
    out.push('')
  }
  return out.join('\n')
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
}

const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

/** Replaces [[slug|name]] wiki links with in-map links. */
function convertWikiLinks(text: string, titles: Map<string, string>): string {
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, slug: string, name?: string) =>
    pageLink(slug.trim(), (name || titles.get(slug.trim()) || slug).trim()))
}

/**
 * Turns a wiki page into an outline: headings stay headings, lists stay lists,
 * table rows become one node each ("Field: Value" for two-column tables), and a
 * paragraph collapses to its first sentence. Out/in links become two branches.
 */
export function buildPageMarkdown(
  page: Pick<WikiPage, 'title' | 'page_type' | 'content' | 'out_links' | 'in_links'>,
  titles: Map<string, string>,
  labels: { outLinks: string; inLinks: string },
): string {
  const out: string[] = [`# ${linkText(displayTitle(page))}`, '']
  const lines = (page.content || '').split('\n')
  let inFence = false
  let skippedTitle = false
  let table: string[][] | null = null
  let listDepthBase = 0

  const flushTable = () => {
    if (!table) return
    const [header, ...rows] = table
    const shown = rows.slice(0, MAX_TABLE_ROWS)
    for (const cells of shown) {
      const values = cells.filter(c => c !== '')
      if (values.length === 0) continue
      const label = header && header.length === 2 && cells.length === 2
        ? `**${cells[0]}**: ${cells[1]}`
        : values.join(' · ')
      out.push(`- ${clip(label, 160)}`)
    }
    if (rows.length > shown.length) out.push(`- … (+${rows.length - shown.length})`)
    table = null
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    if (line.trim().startsWith('|')) {
      const next = lines[i + 1] || ''
      if (!table && TABLE_SEPARATOR.test(next)) {
        table = [splitRow(convertWikiLinks(line, titles))]
        i++ // skip separator
        continue
      }
      if (table) {
        table.push(splitRow(convertWikiLinks(line, titles)))
        continue
      }
    }
    flushTable()

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const text = heading[2].trim()
      // The body usually repeats the page title as its H1; the root already shows it.
      if (level === 1 && !skippedTitle) {
        skippedTitle = true
        continue
      }
      out.push('', `${'#'.repeat(Math.min(Math.max(level, 2), 6))} ${clip(convertWikiLinks(text, titles), 160)}`, '')
      listDepthBase = 0
      continue
    }

    const item = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (item) {
      const depth = Math.floor(item[1].replace(/\t/g, '  ').length / 2)
      out.push(`${'  '.repeat(depth + listDepthBase)}- ${clip(convertWikiLinks(item[3], titles), 200)}`)
      continue
    }

    const text = line.trim()
    if (!text || /^!\[/.test(text) || /^(-{3,}|\*{3,})$/.test(text) || text.startsWith('SUMMARY:')) continue
    const firstSentence = text.split(/(?<=[.!?。！？])\s/)[0]
    out.push(`- ${clip(convertWikiLinks(firstSentence, titles), 200)}`)
  }
  flushTable()

  const linkBranch = (label: string, slugs: string[] | undefined) => {
    const list = (slugs || []).filter(Boolean)
    if (list.length === 0) return
    // Folded on first render: backlink fans can dwarf the page's own content.
    out.push('', `## ${label} (${list.length}) <!-- markmap: fold -->`, '')
    for (const slug of list.slice(0, MAX_LINKS)) out.push(`- ${pageLink(slug, titles.get(slug) || slug)}`)
    if (list.length > MAX_LINKS) out.push(`- … (+${list.length - MAX_LINKS})`)
  }
  linkBranch(labels.outLinks, page.out_links)
  linkBranch(labels.inLinks, page.in_links)

  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}
