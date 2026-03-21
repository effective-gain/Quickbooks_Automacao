-- ==========================================
-- BuildBooks - Initial Schema
-- Construction ERP + QuickBooks Automation
-- ==========================================

-- Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ein text,
  address text,
  phone text,
  qb_realm_id text,
  created_at timestamptz DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'contractor' CHECK (role IN ('admin', 'contractor', 'subcontractor', 'accountant')),
  company_id uuid REFERENCES companies(id),
  phone text,
  locale text DEFAULT 'en',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- QuickBooks Connections
CREATE TABLE qb_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  realm_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  total_sf numeric,
  budget_total numeric DEFAULT 0,
  actual_total numeric DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cost Categories
CREATE TABLE cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  qb_account_id text,
  parent_id uuid REFERENCES cost_categories(id),
  sort_order int DEFAULT 0
);

-- Cost Entries
CREATE TABLE cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id uuid REFERENCES cost_categories(id),
  description text NOT NULL,
  amount numeric NOT NULL,
  vendor_id uuid,
  invoice_id uuid,
  qb_txn_id text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Takeoffs
CREATE TABLE takeoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'error')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Takeoff Items
CREATE TABLE takeoff_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  takeoff_id uuid NOT NULL REFERENCES takeoffs(id) ON DELETE CASCADE,
  category_id uuid REFERENCES cost_categories(id),
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_cost numeric,
  total_cost numeric
);

-- Budgets
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version int DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  total numeric DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Budget Lines
CREATE TABLE budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id uuid REFERENCES cost_categories(id),
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_cost numeric NOT NULL,
  total numeric NOT NULL
);

-- Subcontractors
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trade text NOT NULL,
  email text,
  phone text,
  ein text,
  is_compliant boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Document Requests
CREATE TABLE document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected', 'expired')),
  file_url text,
  expires_at timestamptz,
  requested_at timestamptz DEFAULT now(),
  uploaded_at timestamptz
);

-- Invoices
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subcontractor_id uuid REFERENCES subcontractors(id),
  invoice_number text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  amount numeric NOT NULL,
  due_date date NOT NULL,
  qb_invoice_id text,
  created_at timestamptz DEFAULT now()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  category_id uuid REFERENCES cost_categories(id)
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text NOT NULL,
  account_number_last4 text NOT NULL,
  balance numeric DEFAULT 0,
  qb_account_id text,
  updated_at timestamptz DEFAULT now()
);

-- Bank Transactions
CREATE TABLE bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category_id uuid REFERENCES cost_categories(id),
  is_reconciled boolean DEFAULT false,
  qb_txn_id text
);

-- Automation Rules
CREATE TABLE automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  conditions jsonb DEFAULT '{}',
  actions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Sync Logs
CREATE TABLE sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  records_synced int DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qb_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Company-scoped policies: users can access data from their company
CREATE POLICY "Company members can view company" ON companies
  FOR SELECT USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company members can view projects" ON projects
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company members can manage projects" ON projects
  FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company members can view cost categories" ON cost_categories
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company members can view cost entries" ON cost_entries
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Company members can view subcontractors" ON subcontractors
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company members can view invoices" ON invoices
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Company members can view bank accounts" ON bank_accounts
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company members can view sync logs" ON sync_logs
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ==========================================
-- Auto-create profile on signup
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, locale)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'contractor'),
    'en'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_cost_entries_project ON cost_entries(project_id);
CREATE INDEX idx_cost_entries_category ON cost_entries(category_id);
CREATE INDEX idx_cost_entries_date ON cost_entries(date);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(date);
CREATE INDEX idx_sync_logs_company ON sync_logs(company_id);
CREATE INDEX idx_document_requests_sub ON document_requests(subcontractor_id);
CREATE INDEX idx_document_requests_status ON document_requests(status);
