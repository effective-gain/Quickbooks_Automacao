-- ==========================================
-- Seed: Default cost categories for construction
-- These are created when a company is first set up
-- ==========================================

-- We'll use a function that seeds categories for a given company
CREATE OR REPLACE FUNCTION public.seed_company_defaults(p_company_id uuid)
RETURNS void AS $$
DECLARE
  cat_id uuid;
BEGIN
  -- CSI Division-based categories (standard US construction)
  INSERT INTO cost_categories (company_id, name, sort_order) VALUES
    (p_company_id, 'General Conditions', 1),
    (p_company_id, 'Site Work', 2),
    (p_company_id, 'Concrete / Foundation', 3),
    (p_company_id, 'Masonry', 4),
    (p_company_id, 'Metals / Structural Steel', 5),
    (p_company_id, 'Wood / Framing', 6),
    (p_company_id, 'Thermal & Moisture Protection', 7),
    (p_company_id, 'Doors & Windows', 8),
    (p_company_id, 'Finishes', 9),
    (p_company_id, 'Specialties', 10),
    (p_company_id, 'Equipment', 11),
    (p_company_id, 'Furnishings', 12),
    (p_company_id, 'Fire Suppression', 13),
    (p_company_id, 'Plumbing', 14),
    (p_company_id, 'HVAC', 15),
    (p_company_id, 'Electrical', 16),
    (p_company_id, 'Roofing', 17),
    (p_company_id, 'Exterior Improvements', 18),
    (p_company_id, 'Utilities', 19),
    (p_company_id, 'Permits & Fees', 20),
    (p_company_id, 'Insurance', 21),
    (p_company_id, 'Labor - General', 22),
    (p_company_id, 'Materials - General', 23),
    (p_company_id, 'Equipment Rental', 24),
    (p_company_id, 'Contingency', 25);

  -- Default automation rules
  INSERT INTO automation_rules (company_id, name, trigger_type, conditions, actions, is_active) VALUES
    (p_company_id, 'Electric Subs', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "electric"}'::jsonb,
     '{"categoryName": "Electrical"}'::jsonb, true),
    (p_company_id, 'Plumbing Subs', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "plumb"}'::jsonb,
     '{"categoryName": "Plumbing"}'::jsonb, true),
    (p_company_id, 'HVAC Subs', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "hvac"}'::jsonb,
     '{"categoryName": "HVAC"}'::jsonb, true),
    (p_company_id, 'Home Depot / Lowes → Materials', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "home depot"}'::jsonb,
     '{"categoryName": "Materials - General"}'::jsonb, true),
    (p_company_id, 'Large Payment Alert (>$50k)', 'categorize_transaction',
     '{"field": "amount", "operator": "greater_than", "value": "50000"}'::jsonb,
     '{"alert": "whatsapp", "requireApproval": true}'::jsonb, true),
    (p_company_id, 'Insurance Auto-Cat', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "insurance"}'::jsonb,
     '{"categoryName": "Insurance"}'::jsonb, true),
    (p_company_id, 'Concrete Subs', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "concrete"}'::jsonb,
     '{"categoryName": "Concrete / Foundation"}'::jsonb, true),
    (p_company_id, 'Roofing Subs', 'categorize_transaction',
     '{"field": "description", "operator": "contains", "value": "roof"}'::jsonb,
     '{"categoryName": "Roofing"}'::jsonb, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-seed when a new company is created
CREATE OR REPLACE FUNCTION public.on_company_created()
RETURNS trigger AS $$
BEGIN
  PERFORM seed_company_defaults(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_seed_company
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION on_company_created();
