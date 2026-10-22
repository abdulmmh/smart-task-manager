-- ========================================================
-- Smart Task & Project Management System — Seed Data
-- 2 Admins, 5 Team Members, 3 Projects, 14 Diverse Tasks
-- Default Password for all demo accounts: password123
-- ========================================================

-- Deterministic UUIDs for reliable relational seeding
-- Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
-- Admins
('11111111-1111-1111-1111-111111111111', 'Alex Turner', 'alex.admin@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'admin'),
('22222222-2222-2222-2222-222222222222', 'Rachel Adams', 'rachel.pm@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'admin'),
-- Team Members
('33333333-3333-3333-3333-333333333333', 'John Smith', 'john.dev@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'member'),
('44444444-4444-4444-4444-444444444444', 'Sarah Connor', 'sarah.dev@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'member'),
('55555555-5555-5555-5555-555555555555', 'Michael Scott', 'michael.qa@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'member'),
('66666666-6666-6666-6666-666666666666', 'Emma Watson', 'emma.ui@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'member'),
('77777777-7777-7777-7777-777777777777', 'David Miller', 'david.ops@brightmind.com', '$2b$10$MOjb6Vlt8aICjSxxlCc2ye1msP9BpnlSvu7XwOF3.NHyire3bzTvm', 'member');

-- Projects
INSERT INTO projects (id, name, description, created_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer Portal Redesign', 'Revamp client-facing dashboard with modern UI, self-service billing, and telemetry.', '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Payment Gateway Integration', 'Integrate Stripe and PayPal with automated recurring subscriptions and webhooks.', '22222222-2222-2222-2222-222222222222'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mobile Application API v2', 'Design and implement high-performance REST APIs with caching and rate limiting.', '11111111-1111-1111-1111-111111111111');

-- Tasks (14 Tasks across 3 projects and 5 team members)
INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id, created_by) VALUES
-- Project 1: Customer Portal Redesign
('10000000-0000-0000-0000-000000000001', 'Design High-Fidelity Figma Mockups', 'Create responsive mobile and desktop wireframes for customer analytics view.', 'Completed', 'High', CURRENT_DATE - INTERVAL '10 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111'),
('10000000-0000-0000-0000-000000000002', 'Implement Client Authentication Flows', 'Build registration, login, and password reset views with JWT token handling.', 'Completed', 'High', CURRENT_DATE - INTERVAL '3 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
('10000000-0000-0000-0000-000000000003', 'Build Responsive Navigation Sidebar', 'Implement collapsible navigation drawer with active route highlighting.', 'In Progress', 'Medium', CURRENT_DATE + INTERVAL '4 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111'),
('10000000-0000-0000-0000-000000000004', 'Fix Cross-Browser Font Rendering', 'Investigate and resolve typography rendering discrepancies in Safari.', 'To Do', 'Low', CURRENT_DATE + INTERVAL '12 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
('10000000-0000-0000-0000-000000000005', 'Audit Accessibility (WCAG 2.1 AA)', 'Review color contrast, keyboard navigation, and aria labels across portal.', 'In Progress', 'High', CURRENT_DATE - INTERVAL '2 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'), -- OVERDUE

-- Project 2: Payment Gateway Integration
('20000000-0000-0000-0000-000000000001', 'Set Up Stripe Webhook Listener', 'Implement HMAC signature verification and idempotency check for incoming events.', 'Completed', 'High', CURRENT_DATE - INTERVAL '5 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
('20000000-0000-0000-0000-000000000002', 'Implement Subscription Billing Engine', 'Handle prorations, plan upgrades, and invoice generation on cycle renewals.', 'In Progress', 'High', CURRENT_DATE + INTERVAL '2 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
('20000000-0000-0000-0000-000000000003', 'Write End-to-End Payment Test Suite', 'Simulate 3D-Secure challenges and declined card edge cases in staging.', 'In Progress', 'Medium', CURRENT_DATE - INTERVAL '4 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'), -- OVERDUE
('20000000-0000-0000-0000-000000000004', 'Configure PCI-DSS Compliance Log Masking', 'Ensure credit card numbers and CVVs are strictly purged from stdout and error logs.', 'To Do', 'High', CURRENT_DATE - INTERVAL '1 day', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222'), -- OVERDUE

-- Project 3: Mobile Application API v2
('30000000-0000-0000-0000-000000000001', 'Database Index Tuning for Feed Query', 'Analyze EXPLAIN ANALYZE on activity feed query and add composite indexes.', 'Completed', 'High', CURRENT_DATE - INTERVAL '1 day', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
('30000000-0000-0000-0000-000000000002', 'Implement Sliding Window Rate Limiting', 'Prevent brute-force API hammering by enforcing 100 requests per minute per IP.', 'In Progress', 'Medium', CURRENT_DATE + INTERVAL '6 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111'),
('30000000-0000-0000-0000-000000000003', 'Generate OpenAPI 3.0 Documentation', 'Produce Swagger JSON definition for client iOS/Android development teams.', 'To Do', 'Medium', CURRENT_DATE + INTERVAL '8 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
('30000000-0000-0000-0000-000000000004', 'Set Up Docker Staging Deployment', 'Containerize the Express backend with multi-stage Dockerfile and healthcheck.', 'To Do', 'Low', CURRENT_DATE + INTERVAL '14 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111'),
('30000000-0000-0000-0000-000000000005', 'Implement Push Notification Worker', 'Deliver real-time task assignment alerts using Firebase Cloud Messaging.', 'To Do', 'Low', CURRENT_DATE + INTERVAL '18 days', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111');
