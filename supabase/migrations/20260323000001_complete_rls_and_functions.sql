-- ==========================================
-- Complete RLS policies (write access) + Functions
-- ==========================================

-- Helper: get user's company_id
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==========================================
-- WRITE policies for all company-scoped tables
-- ==========================================

-- Companies: admins can update
CREATE POLICY "Admins can update company" ON companies
  FOR UPDATE USING (
    id = get_my_company_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles: allow insert (trigger handles it, but service role needs it)
CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Cost Categories: company members can manage
CREATE POLICY "Company members can manage cost categories" ON cost_categories
  FOR ALL USING (company_id = get_my_company_id());

-- Cost Entries: company members can manage
CREATE POLICY "Company members can manage cost entries" ON cost_entries
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id())
  );

-- Takeoffs: company members can manage
CREATE POLICY "Company members can view takeoffs" ON takeoffs
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id())
  );
CREATE POLICY "Company members can manage takeoffs" ON takeoffs
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id())
  );

-- Takeoff Items
CREATE POLICY "Company members can view takeoff items" ON takeoff_items
  FOR SELECT USING (
    takeoff_id IN (SELECT id FROM takeoffs WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()))
  );
CREATE POLICY "Company members can manage takeoff items" ON takeoff_items
  FOR ALL USING (
    takeoff_id IN (SELECT id FROM takeoffs WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()))
  );

-- Budgets
CREATE POLICY "Company members can view budgets" ON budgets
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id())
  );
CREATE POLICY "Company members can manage budgets" ON budgets
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id())
  );

-- Budget Lines
CREATE POLICY "Company members can view budget lines" ON budget_lines
  FOR SELECT USING (
    budget_id IN (SELECT id FROM budgets WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()))
  );
CREATE POLICY "Company members can manage budget lines" ON budget_lines
  FOR ALL USING (
    budget_id IN (SELECT id FROM budgets WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()))
  );

-- Subcontractors: manage
CREATE POLICY "Company members can manage subcontractors" ON subcontractors
  FOR ALL USING (company_id = get_my_company_id());

-- Document Requests
CREATE POLICY "Company members can view document requests" ON document_requests
  FOR SELECT USING (
    subcontractor_id IN (SELECT id FROM subcontractors WHERE company_id = get_my_company_id())
  );
CREATE POLICY "Company members can manage document requests" ON document_requests
  FOR ALL USING (
    subcontractor_id IN (SELECT id FROM subcontractors WHERE company_id = get_my_company_id())
  );

-- Invoices: manage
CREATE POLICY "Company members can manage invoices" ON invoices
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id())
  );

-- Invoice Items
CREATE POLICY "Company members can view invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()))
  );
CREATE POLICY "Company members can manage invoice items" ON invoice_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_my_company_id()))
  );

-- Bank Accounts: manage
CREATE POLICY "Company members can manage bank accounts" ON bank_accounts
  FOR ALL USING (company_id = get_my_company_id());

-- Bank Transactions
CREATE POLICY "Company members can view bank transactions" ON bank_transactions
  FOR SELECT USING (
    bank_account_id IN (SELECT id FROM bank_accounts WHERE company_id = get_my_company_id())
  );
CREATE POLICY "Company members can manage bank transactions" ON bank_transactions
  FOR ALL USING (
    bank_account_id IN (SELECT id FROM bank_accounts WHERE company_id = get_my_company_id())
  );

-- Automation Rules: manage
CREATE POLICY "Company members can manage automation rules" ON automation_rules
  FOR ALL USING (company_id = get_my_company_id());

-- Sync Logs: manage
CREATE POLICY "Company members can manage sync logs" ON sync_logs
  FOR ALL USING (company_id = get_my_company_id());

-- QB Connections: admins/accountants only
CREATE POLICY "Authorized users can view QB connections" ON qb_connections
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
  );
CREATE POLICY "Authorized users can manage QB connections" ON qb_connections
  FOR ALL USING (
    company_id = get_my_company_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
  );

-- ==========================================
-- Function: Update project actual_total
-- Called after cost_entries insert/update/delete
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_project_actual(p_project_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET actual_total = COALESCE((
    SELECT SUM(amount) FROM cost_entries WHERE project_id = p_project_id
  ), 0),
  updated_at = now()
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-update project actual_total on cost entry changes
CREATE OR REPLACE FUNCTION public.trigger_update_project_actual()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_actual(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_actual(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_cost_entry_change
  AFTER INSERT OR UPDATE OR DELETE ON cost_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_update_project_actual();

-- ==========================================
-- Function: Update budget total from lines
-- ==========================================

CREATE OR REPLACE FUNCTION public.trigger_update_budget_total()
RETURNS trigger AS $$
BEGIN
  UPDATE budgets
  SET total = COALESCE((
    SELECT SUM(total) FROM budget_lines WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
  ), 0)
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_budget_line_change
  AFTER INSERT OR UPDATE OR DELETE ON budget_lines
  FOR EACH ROW EXECUTE FUNCTION trigger_update_budget_total();

-- ==========================================
-- Function: Auto-expire documents
-- ==========================================

CREATE OR REPLACE FUNCTION public.expire_documents()
RETURNS void AS $$
BEGIN
  UPDATE document_requests
  SET status = 'expired'
  WHERE status IN ('uploaded', 'approved')
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
