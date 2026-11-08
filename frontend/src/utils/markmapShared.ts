import DOMPurify from 'dompurify'
import i18n from '@/i18n'
import type { Markmap } from 'markmap-view'
import type { IPureNode } from 'markmap-common'

// markmap renders Markdown outlines (headings + nested lists) as interactive
// mind maps. Both packages are loaded lazily so the chat bundle only pays for
// them when a mind map is actually on screen.
type MarkmapLib = typeof import('markmap-lib')
type MarkmapView = typeof import('markmap-view')

let libPromise: Promise<[MarkmapLib, MarkmapView]> | null = null
let transformer: InstanceType<MarkmapLib['Transformer']> | null = null

async function loadMarkmap() {
  if (!libPromise) {
    libPromise = Promise.all([import('markmap-lib'), import('markmap-view')])
  }
  const [lib, view] = await libPromise
  if (!transformer) transformer = new lib.Transformer()
  return { transformer, view }
}

// Node labels are HTML produced by markdown-it from text that may come from an
// LLM or from ingested documents, so every label is sanitised before markmap
// injects it into a foreignObject.
function sanitizeTree(node: IPureNode) {
  node.content = DOMPurify.sanitize(node.content, {
    ALLOWED_TAGS: ['a', 'b', 'strong', 'i', 'em', 'code', 'span', 'del', 's', 'br', 'sub', 'sup'],
    ALLOWED_ATTR: ['href', 'title'],
  })
  node.children?.forEach(sanitizeTree)
}

export interface MarkmapRenderOptions {
  initialExpandLevel?: number
  maxWidth?: number
}

export async function markdownToMarkmapTree(markdown: string): Promise<IPureNode> {
  const { transformer } = await loadMarkmap()
  const { root } = transformer.transform(markdown)
  sanitizeTree(root)
  return root
}

export async function createMarkmap(
  svg: SVGSVGElement,
  markdown: string,
  opts: MarkmapRenderOptions = {},
): Promise<Markmap> {
  const { view } = await loadMarkmap()
  const root = await markdownToMarkmapTree(markdown)
  const mm = view.Markmap.create(svg, {
    autoFit: true,
    duration: 300,
    initialExpandLevel: opts.initialExpandLevel ?? -1,
    maxWidth: opts.maxWidth ?? 320,
    maxInitialScale: 1.2,
    paddingX: 10,
    spacingVertical: 8,
    spacingHorizontal: 90,
  })
  await mm.setData(root)
  await mm.fit()
  return mm
}

export async function updateMarkmap(
  mm: Markmap,
  markdown: string,
  opts: MarkmapRenderOptions = {},
): Promise<void> {
  const root = await markdownToMarkmapTree(markdown)
  await mm.setData(root, {
    initialExpandLevel: opts.initialExpandLevel ?? -1,
  })
  await mm.fit()
}

/**
 * Serialises the current markmap SVG, with markmap's stylesheet inlined, so it
 * can be saved as a standalone file.
 */
export function markmapSvgMarkup(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const { width, height } = svg.getBoundingClientRect()
  clone.setAttribute('width', String(Math.round(width)))
  clone.setAttribute('height', String(Math.round(height)))
  return new XMLSerializer().serializeToString(clone)
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Chat markdown renders a ```markmap fence as a placeholder; the source stays
 * in a hidden <pre> so the block can be re-hydrated (or copied) later.
 */
export function buildMarkmapBlockHtml(source: string): string {
  const label = escapeHtml(i18n.global.t('mindmap.badge'))
  const fitLabel = escapeHtml(i18n.global.t('mindmap.fit'))
  return `<div class="chat-markmap-block">
    <div class="chat-markmap-block__header">
      <span class="chat-markmap-block__badge">${label}</span>
      <button type="button" class="chat-markmap-block__fit" title="${fitLabel}">${fitLabel}</button>
    </div>
    <pre class="chat-markmap-block__source" data-markmap="false"><code>${escapeHtml(source)}</code></pre>
  </div>`
}

const liveMaps = new WeakMap<HTMLElement, Markmap>()

export async function renderMarkmapInContainer(
  rootElement: HTMLElement | null | undefined,
): Promise<void> {
  if (!rootElement) return
  const sources = rootElement.querySelectorAll<HTMLElement>('pre.chat-markmap-block__source[data-markmap="false"]')
  for (const pre of sources) {
    const block = pre.closest<HTMLElement>('.chat-markmap-block')
    if (!block) continue
    const markdown = (pre.textContent || '').trim()
    if (!markdown) continue
    pre.setAttribute('data-markmap', 'true')
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.classList.add('chat-markmap-block__canvas')
      block.appendChild(svg)
      const mm = await createMarkmap(svg, markdown, { initialExpandLevel: 3 })
      liveMaps.set(block, mm)
      block.querySelector<HTMLButtonElement>('.chat-markmap-block__fit')
        ?.addEventListener('click', () => { void mm.fit() })
    } catch (e) {
      console.error('Markmap rendering error:', e)
      pre.setAttribute('data-markmap', 'error')
      pre.style.display = 'block'
    }
  }
}
