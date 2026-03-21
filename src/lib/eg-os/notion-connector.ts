// ==========================================
// EG OS — Notion Connector
// Notion = source of truth
// Reads DNA, roadmap, status from Notion
// ==========================================

const NOTION_API_KEY = process.env.NOTION_API_KEY || ''
const NOTION_API_URL = 'https://api.notion.com/v1'

interface NotionPage {
  id: string
  url: string
  properties: Record<string, unknown>
  created_time: string
  last_edited_time: string
}

async function notionRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${NOTION_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Notion API error ${res.status}: ${error}`)
  }

  return res.json()
}

// Search for pages in Notion
export async function searchNotion(query: string, filter?: { property: string; value: string }) {
  return notionRequest('/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      filter: filter ? { property: 'object', value: 'page' } : undefined,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
    }),
  })
}

// Get a specific page
export async function getNotionPage(pageId: string) {
  return notionRequest<NotionPage>(`/pages/${pageId}`)
}

// Get page content (blocks)
export async function getNotionBlocks(pageId: string) {
  return notionRequest(`/blocks/${pageId}/children?page_size=100`)
}

// Query a database
export async function queryNotionDatabase(databaseId: string, filter?: Record<string, unknown>) {
  return notionRequest(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({ filter, page_size: 100 }),
  })
}

// Create a page in a database
export async function createNotionPage(databaseId: string, properties: Record<string, unknown>) {
  return notionRequest('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  })
}

// Update a page
export async function updateNotionPage(pageId: string, properties: Record<string, unknown>) {
  return notionRequest(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  })
}

// ==========================================
// EG Build specific — sync project status to Notion
// ==========================================

export async function syncProjectToNotion(project: {
  name: string
  status: string
  budget: number
  spent: number
  costPerSF?: number
}) {
  if (!NOTION_API_KEY) {
    console.warn('[Notion] API key not configured, skipping sync')
    return null
  }

  const notionDbId = process.env.NOTION_PROJECTS_DB_ID
  if (!notionDbId) return null

  // Search for existing page
  const existing = await searchNotion(project.name)
  const pages = (existing as { results: NotionPage[] }).results

  const properties: Record<string, unknown> = {
    'Name': { title: [{ text: { content: project.name } }] },
    'Status': { select: { name: project.status } },
    'Budget': { number: project.budget },
    'Spent': { number: project.spent },
  }

  if (project.costPerSF) {
    properties['Cost/SF'] = { number: project.costPerSF }
  }

  if (pages.length > 0) {
    return updateNotionPage(pages[0].id, properties)
  }

  return createNotionPage(notionDbId, properties)
}

// Sync automation log to Notion
export async function logToNotion(entry: {
  action: string
  arm: string
  agent: string
  result: string
  timestamp: string
}) {
  if (!NOTION_API_KEY) return null

  const logDbId = process.env.NOTION_LOGS_DB_ID
  if (!logDbId) return null

  return createNotionPage(logDbId, {
    'Action': { title: [{ text: { content: entry.action } }] },
    'Arm': { select: { name: entry.arm } },
    'Agent': { rich_text: [{ text: { content: entry.agent } }] },
    'Result': { select: { name: entry.result } },
    'Timestamp': { date: { start: entry.timestamp } },
  })
}
