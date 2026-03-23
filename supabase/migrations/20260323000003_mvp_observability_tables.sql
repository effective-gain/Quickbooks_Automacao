-- ==========================================
-- MVP Observability & Traceability Tables
-- webhook_events, orchestrator_runs, agent_runs,
-- quickbooks_entities, audit_logs, notifications,
-- conversations
-- ==========================================

-- Webhook Events (every inbound event with correlation_id)
CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  source text NOT NULL, -- 'whatsapp', 'quickbooks', 'n8n'
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'success', 'error', 'duplicate')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_webhook_events_correlation ON webhook_events(correlation_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE UNIQUE INDEX idx_webhook_events_idempotency ON webhook_events(source, (payload->>'messageId')) WHERE payload->>'messageId' IS NOT NULL;

-- Orchestrator Runs (every orchestrator execution)
CREATE TABLE orchestrator_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id uuid NOT NULL,
  webhook_event_id uuid REFERENCES webhook_events(id),
  company_id uuid REFERENCES companies(id),
  event_type text NOT NULL,
  action_type text NOT NULL,
  arm text NOT NULL,
  agent_called text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'success', 'error')),
  error_message text,
  duration_ms int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orchestrator_runs_correlation ON orchestrator_runs(correlation_id);
CREATE INDEX idx_orchestrator_runs_company ON orchestrator_runs(company_id);

-- Agent Runs (every agent execution)
CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestrator_run_id uuid REFERENCES orchestrator_runs(id),
  agent_name text NOT NULL,
  company_id uuid REFERENCES companies(id),
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'success', 'error', 'need_more_data')),
  error_message text,
  intuit_tid text,
  duration_ms int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_runs_orchestrator ON agent_runs(orchestrator_run_id);
CREATE INDEX idx_agent_runs_agent ON agent_runs(agent_name);

-- QuickBooks Entities (local mirror of QB data)
CREATE TABLE quickbooks_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'Invoice', 'Bill', 'Customer', 'Vendor', etc
  intuit_id text NOT NULL,
  intuit_tid text,
  sync_token text,
  data jsonb NOT NULL DEFAULT '{}',
  synced_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, entity_type, intuit_id)
);

CREATE INDEX idx_qb_entities_company ON quickbooks_entities(company_id);
CREATE INDEX idx_qb_entities_type ON quickbooks_entities(entity_type);

-- Audit Logs (every user/system action)
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL, -- 'create', 'update', 'delete', 'connect', 'disconnect', 'sync'
  resource_type text NOT NULL, -- 'invoice', 'project', 'qb_connection', etc
  resource_id text,
  changes jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Notifications (in-app notifications)
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL, -- 'info', 'warning', 'error', 'success'
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Conversations (WhatsApp conversation tracking)
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  phone text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  last_message_at timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}', -- memory/state for the conversation
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_company ON conversations(company_id);

-- ==========================================
-- RLS for new tables
-- ==========================================

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view webhook events" ON webhook_events
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "Company members can view orchestrator runs" ON orchestrator_runs
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "Company members can view agent runs" ON agent_runs
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "Company members can view QB entities" ON quickbooks_entities
  FOR ALL USING (company_id = get_my_company_id());

CREATE POLICY "Company members can view audit logs" ON audit_logs
  FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "Users can view own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Company members can view conversations" ON conversations
  FOR ALL USING (company_id = get_my_company_id());

-- Service role needs full access for webhook/orchestrator writes
CREATE POLICY "Service can manage webhook events" ON webhook_events
  FOR ALL USING (true);
CREATE POLICY "Service can manage orchestrator runs" ON orchestrator_runs
  FOR ALL USING (true);
CREATE POLICY "Service can manage agent runs" ON agent_runs
  FOR ALL USING (true);
CREATE POLICY "Service can manage audit logs" ON audit_logs
  FOR ALL USING (true);
