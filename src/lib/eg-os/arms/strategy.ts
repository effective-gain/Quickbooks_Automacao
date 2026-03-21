// ==========================================
// Braco 4 — Gestao Estrategica
// KPIs, ROI, Reports, $/SF tracking
// ==========================================

import type { OrchestratorAction, ActionType } from '../orchestrator'
import { createClient } from '@/lib/supabase/server'

export async function handleStrategy(
  action: OrchestratorAction,
  agent: string
): Promise<{ data?: unknown; nextActions?: ActionType[] }> {
  switch (agent) {
    case 'KPITracker':
      return handleKPITracking(action)
    case 'ReportGenerator':
      return handleReportGeneration(action)
    case 'ROICalculator':
      return handleROICalculation(action)
    default:
      return { data: { message: `Agent ${agent} not implemented` } }
  }
}

async function handleKPITracking(action: OrchestratorAction) {
  const { projectId } = action.payload as { projectId?: string }
  const supabase = await createClient()

  if (projectId) {
    // Single project KPIs
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) throw new Error('Project not found')

    const costPerSF = project.total_sf && project.total_sf > 0
      ? project.actual_total / project.total_sf
      : null

    const budgetUtilization = project.budget_total > 0
      ? (project.actual_total / project.budget_total) * 100
      : 0

    const variance = project.budget_total - project.actual_total

    // Get cost breakdown by category
    const { data: entries } = await supabase
      .from('cost_entries')
      .select('category_id, amount, cost_categories(name)')
      .eq('project_id', projectId)

    const categoryTotals: Record<string, number> = {}
    for (const entry of entries || []) {
      const catName = (entry as unknown as { cost_categories: { name: string } | null }).cost_categories?.name || 'Uncategorized'
      categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(entry.amount)
    }

    return {
      data: {
        project: project.name,
        kpis: {
          totalBudget: project.budget_total,
          totalSpent: project.actual_total,
          remaining: variance,
          budgetUtilization: Math.round(budgetUtilization * 100) / 100,
          costPerSF,
          totalSF: project.total_sf,
          status: project.status,
        },
        categoryBreakdown: categoryTotals,
      },
    }
  }

  // All projects summary
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .neq('status', 'cancelled')

  const summary = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter(p => p.status === 'in_progress').length || 0,
    totalBudget: projects?.reduce((s, p) => s + Number(p.budget_total), 0) || 0,
    totalSpent: projects?.reduce((s, p) => s + Number(p.actual_total), 0) || 0,
  }

  return { data: summary }
}

async function handleReportGeneration(action: OrchestratorAction) {
  const { reportType, projectId, dateRange } = action.payload as {
    reportType: 'pl' | 'cashflow' | 'cost_breakdown' | 'sf_analysis'
    projectId?: string
    dateRange?: { start: string; end: string }
  }

  const supabase = await createClient()

  switch (reportType) {
    case 'cost_breakdown': {
      const query = supabase
        .from('cost_entries')
        .select('*, cost_categories(name)')

      if (projectId) query.eq('project_id', projectId)
      if (dateRange) {
        query.gte('date', dateRange.start)
        query.lte('date', dateRange.end)
      }

      const { data: entries } = await query

      const breakdown: Record<string, { total: number; count: number }> = {}
      for (const entry of entries || []) {
        const cat = (entry as unknown as { cost_categories: { name: string } | null }).cost_categories?.name || 'Uncategorized'
        if (!breakdown[cat]) breakdown[cat] = { total: 0, count: 0 }
        breakdown[cat].total += Number(entry.amount)
        breakdown[cat].count++
      }

      return { data: { reportType, breakdown } }
    }

    case 'sf_analysis': {
      const { data: projects } = await supabase
        .from('projects')
        .select('name, total_sf, budget_total, actual_total')
        .gt('total_sf', 0)

      const analysis = (projects || []).map(p => ({
        project: p.name,
        totalSF: p.total_sf,
        budgetPerSF: p.total_sf ? Number(p.budget_total) / Number(p.total_sf) : 0,
        actualPerSF: p.total_sf ? Number(p.actual_total) / Number(p.total_sf) : 0,
      }))

      return { data: { reportType, analysis } }
    }

    default:
      return { data: { reportType, message: 'Report type not yet implemented' } }
  }
}

async function handleROICalculation(action: OrchestratorAction) {
  const { projectId } = action.payload as { projectId: string }
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  // Get revenue (paid invoices)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount')
    .eq('project_id', projectId)
    .eq('status', 'paid')

  const totalRevenue = invoices?.reduce((s, i) => s + Number(i.amount), 0) || 0
  const totalCost = Number(project.actual_total)
  const profit = totalRevenue - totalCost
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return {
    data: {
      project: project.name,
      revenue: totalRevenue,
      cost: totalCost,
      profit,
      roi: Math.round(roi * 100) / 100,
      margin: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 10000) / 100 : 0,
    },
  }
}
