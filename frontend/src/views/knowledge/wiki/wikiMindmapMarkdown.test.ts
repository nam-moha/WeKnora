import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildOverviewMarkdown, buildPageMarkdown, displayTitle, PAGE_CHUNK, type MindmapEntry } from './wikiMindmapMarkdown'

const label = (t: string) => ({ summary: 'Docs', entity: 'Entities', concept: 'Concepts' } as Record<string, string>)[t] || t

describe('displayTitle', () => {
  it('strips the summary suffix and file extension', () => {
    assert.equal(displayTitle({ title: 'PO-FT22-0005.md - Summary', type: 'summary' }), 'PO-FT22-0005')
  })
  it('leaves other page types alone', () => {
    assert.equal(displayTitle({ title: 'Moha Software', type: 'entity' }), 'Moha Software')
  })
})

describe('buildOverviewMarkdown', () => {
  const entries: MindmapEntry[] = [
    { slug: 'summary/a', title: 'PO-1.md - Summary', summary: '', type: 'summary' },
    { slug: 'entity/x', title: 'Project X', summary: '', type: 'entity', category_path: ['Projects'] },
    { slug: 'entity/y', title: 'Sub Y', summary: '', type: 'entity', category_path: ['Projects', 'Mobile'] },
    { slug: 'entity/z', title: 'Loose Z', summary: '', type: 'entity' },
  ]

  it('returns empty for an empty wiki', () => {
    assert.equal(buildOverviewMarkdown('KB', [], label), '')
  })

  it('groups by type then category, pages before sub-categories', () => {
    const md = buildOverviewMarkdown('KB', entries, label)
    assert.ok(md.includes('# KB'))
    assert.ok(md.includes('## Docs (1)'))
    assert.ok(md.includes('## Entities (3)'))
    const lines = md.split('\n')
    const loose = lines.indexOf('- [Loose Z](#wiki:entity%2Fz)')
    const projects = lines.indexOf('- **Projects** (2)')
    assert.ok(loose > -1)
    assert.ok(projects > loose)
    assert.equal(lines[projects + 1], '  - [Project X](#wiki:entity%2Fx)')
    assert.equal(lines[projects + 2], '  - **Mobile** (1)')
    assert.equal(lines[projects + 3], '    - [Sub Y](#wiki:entity%2Fy)')
  })

  it('buckets a large flat list into sorted ranges', () => {
    const many: MindmapEntry[] = Array.from({ length: PAGE_CHUNK + 5 }, (_, i) => ({
      slug: `summary/${i}`, title: `PO-${String(i).padStart(3, '0')}.md - Summary`, summary: '', type: 'summary',
    }))
    const lines = buildOverviewMarkdown('KB', many, label).split('\n')
    assert.ok(lines.includes(`- PO-000 … PO-019 (${PAGE_CHUNK})`))
    assert.ok(lines.includes('- PO-020 … PO-024 (5)'))
    assert.ok(lines.includes('  - [PO-020](#wiki:summary%2F20)'))
  })
})

describe('buildPageMarkdown', () => {
  const titles = new Map([['entity/moha', 'Moha Software'], ['entity/po-1', 'PO-1']])
  const page = {
    title: 'PO-1',
    page_type: 'entity',
    content: [
      '# PO-1',
      '',
      'Đơn đặt hàng của [[entity/moha|Moha Software]]. Câu thứ hai bị bỏ.',
      '',
      '## Thông tin',
      '',
      '| Trường | Giá trị |',
      '|---|---|',
      '| Tổng | ¥135,000 |',
      '',
      '## Hạng mục',
      '',
      '| No | Item | Qty |',
      '|---|---|---|',
      '| 01 | Dev | 0.5 MM |',
      '',
      '```',
      '# not a heading',
      '```',
      '- điểm một',
      '  - điểm con',
    ].join('\n'),
    out_links: ['entity/moha'],
    in_links: ['entity/po-1', 'entity/unknown'],
  }

  const md = buildPageMarkdown(page, titles, { outLinks: 'Links', inLinks: 'Backlinks' })

  it('uses the title as root and drops the duplicate H1', () => {
    assert.equal(md.startsWith('# PO-1'), true)
    assert.equal(md.match(/^# /gm)?.length, 1)
  })

  it('keeps the first sentence and converts wiki links', () => {
    assert.ok(md.includes('- Đơn đặt hàng của [Moha Software](#wiki:entity%2Fmoha).'))
    assert.ok(!md.includes('Câu thứ hai'))
  })

  it('flattens tables into rows', () => {
    assert.ok(md.includes('- **Tổng**: ¥135,000'))
    assert.ok(md.includes('- 01 · Dev · 0.5 MM'))
  })

  it('ignores fenced code and keeps nested lists', () => {
    assert.ok(!md.includes('not a heading'))
    assert.ok(md.includes('- điểm một\n  - điểm con'))
  })

  it('adds link branches, falling back to the slug for unknown titles', () => {
    assert.ok(md.includes('## Links (1) <!-- markmap: fold -->'))
    assert.ok(md.includes('## Backlinks (2) <!-- markmap: fold -->'))
    assert.ok(md.includes('- [entity/unknown](#wiki:entity%2Funknown)'))
  })
})
