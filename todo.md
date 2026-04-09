# LIOTA CRM - Todo

## Database & Backend
- [x] Database schema: students, programs, classes, instructors, leads, payments, invoices, campaigns, contacts, assessments
- [x] tRPC routers: dashboard metrics
- [x] tRPC routers: students CRUD
- [x] tRPC routers: classes/programs CRUD
- [x] tRPC routers: email campaigns CRUD + send
- [x] tRPC routers: accounting (payments, invoices, subscriptions)
- [x] tRPC routers: leads pipeline
- [x] tRPC routers: academic progress / MCER assessments
- [x] tRPC routers: contacts management
- [x] tRPC routers: analytics & reports
- [x] tRPC routers: financial dashboard (admin only, PIN protected)
- [x] Seed data for demo

## Frontend - Global
- [x] Global theme: elegant dark/light palette, LIOTA branding colors
- [x] DashboardLayout with sidebar navigation for all 10 modules
- [x] Responsive layout and mobile-friendly sidebar
- [x] App.tsx routing for all pages

## Frontend - Pages
- [x] Dashboard: KPI cards (students, revenue, campaigns, classes, satisfaction)
- [x] Students: list, search/filter, create/edit modal, profile detail
- [x] Classes/Programs: group list, schedule view, instructor assignment, attendance
- [x] Email Marketing: campaign list, create campaign, template selector, segment filters
- [x] Accounting: payment list, invoice generator, subscription tracker, financial reports
- [x] Leads Pipeline: Kanban board with funnel stages
- [x] Academic Progress: MCER assessment records, progress charts, parent reports
- [x] Contacts: contact list, communication history, notes, tags
- [x] Analytics: retention rate, revenue by program/campus, email performance, enrollment stats
- [x] Financial Dashboard: PIN-protected, blur effect on sensitive numbers, admin-only

## Security & UX
- [x] PIN modal component (4-digit entry) for financial dashboard
- [x] Blur effect on financial figures (visible/intentional black blur)
- [x] Role-based access control (admin vs user)
- [x] Admin-only guard for financial dashboard route

## Tests
- [x] Auth tests (logout, me query)
- [x] Financial dashboard access control tests (admin only, wrong PIN, PIN length)
- [x] Role-based access control tests
- [x] Input validation tests for all major list procedures
- [x] Analytics overview test

## Localization & Rebranding
- [x] Upload LIOTA logo to CDN and add to sidebar/header
- [x] Translate all UI text to English across all 10 pages + layout
- [x] Remove Walter Bernard references — rebranded as LIOTA Institute
- [x] Update app title to "LIOTA CRM"

## Payment Methods
- [x] Add Stripe, Zelle, and Dolla App (Mexico) to DB payment method enum
- [x] Update Accounting page: Stripe/Zelle/Dolla in payment forms and labels
- [x] Payment method icons for all methods

## New Features
- [x] DB: scholarships table
- [x] DB: language packages table (hourly rates: 200 MXN/hr, $20 USD/hr)
- [x] DB: camps table (Winter, Spring, Summer, Fall)
- [x] DB: special_events table
- [x] Backend: scholarships CRUD router
- [x] Backend: language packages router
- [x] Backend: camps router
- [x] Backend: special events router
- [x] Frontend: Scholarships page
- [x] Frontend: Language Packages & Rates page (ESL, SSL, 1-lang, 2-lang, Polyglot, Full)
- [x] Frontend: Seasonal Camps page (Winter, Spring, Summer, Fall)
- [x] Frontend: Special Events page
- [x] Add all new modules to sidebar navigation

## Phase 4 - Templates, Meta Leads, Integrations & Admin
- [x] Language toggle button (EN/ES) in sidebar/header
- [x] Admin-only black blur on finance income figures (not for editor role)
- [x] Email Templates standalone management page
- [x] WhatsApp Templates module with response templates
- [x] Voice Templates module
- [x] Meta Leads: Setup Guide page
- [x] Meta Leads: Webhook Events page
- [x] Meta Leads: Sync Jobs page
- [x] Meta Leads: Error Logs page
- [x] Integrations: Inbound Webhook page
- [x] Admin panel section
- [x] Update sidebar navigation with all new sections (Templates, Meta Leads, Integrations, Admin)
- [x] DB tables: whatsapp_templates, voice_templates, webhook_events, sync_jobs, error_logs, inbound_webhooks

## Phase 5 - Role Permissions Matrix
- [ ] Add Role Permissions Matrix table to Admin Panel (Admin, Instructor, Coordinator, Receptionist)
- [ ] Define all LIOTA-specific permissions (View Dashboard, Manage Students, View Classes, Create Classes, Manage Leads, Email Marketing, Accounting, Financial Dashboard, Scholarships, Camps, Events, Analytics, Manage Users, Audit Log, etc.)
- [ ] Update DB user role enum to include instructor, coordinator, receptionist
- [ ] Enforce role-based access in backend procedures
- [ ] Add Team Members section below the matrix

## Phase 5 - Role Permissions Matrix & AI Front Door
- [ ] Role Permissions Matrix in Admin Panel (Admin, Instructor, Coordinator, Receptionist)
- [ ] Update user role enum: instructor, coordinator, receptionist
- [ ] Team Members section in Admin Panel
- [ ] AI Front Door: public embeddable chat widget page (/chat)
- [ ] AI Front Door: tRPC procedure with LLM + LIOTA knowledge base (STEAM, ESL, SSL, Polyglot, pricing, campuses)
- [ ] AI Front Door: streaming chat responses
- [ ] AI Front Door: 2-line embed snippet (script tag + div)
- [ ] AI Front Door: widget config page in CRM (customize greeting, colors, avatar)
- [ ] AI Front Door: lead capture (name + email before chat starts)
- [ ] AI Front Door: auto-save conversations as leads in CRM pipeline
- [ ] Dashboard greeting cycles through: Hola, Hello, Bonjour, Bom Dia (animated)
- [ ] Replace user name in greeting with "LIOTA Institute"
- [ ] Add Portuguese, Maya Yucateca, French, German, Arabic, Russian to greeting cycle
- [ ] Add all 8 languages to SSL/program options throughout the CRM

## Phase 6 - Bulk Email, Drip System & Integrations
- [ ] Bulk Email page: recipient selector with checkboxes, phase filter, Select All
- [ ] Bulk Email page: compose panel with template loader dropdown
- [ ] Bulk Email page: EN/ES language toggle on compose panel
- [ ] Bulk Email page: subject + body with {{name}} {{first_name}} personalization tokens
- [ ] Bulk Email page: attachments (Image/PDF, Upload Audio, Voice Template) max 5 files
- [ ] Bulk Email page: send delay selector (spam protection)
- [ ] Bulk Email page: Send Test Email + Send to X Recipients buttons
- [ ] Bulk Email page: CAN-SPAM/GDPR unsubscribe footer auto-included notice
- [ ] Drip System: DB tables for drip_sequences and drip_steps
- [ ] Drip System: Welcome to LIOTA Institute template (Day 0)
- [ ] Drip System: Week 1 - Programs Overview email
- [ ] Drip System: Week 2 - Free Trial Class offer
- [ ] Drip System: Week 3 - Student Success Stories
- [ ] Drip System: Week 4 - Enrollment CTA
- [ ] Drip System: Meta Leads trigger (auto-enroll new Meta leads into drip)
- [ ] Drip System: management UI (view sequences, steps, edit, pause/resume)
- [ ] Gmail SMTP: install Nodemailer, configure theliotainstitute@gmail.com
- [ ] Gmail SMTP: request Gmail App Password secret
- [ ] Fix OAuth callback error
- [ ] Connect Stripe sandbox
- [ ] Connect PayPal sandbox
- [ ] Connect Cash App/Square sandbox
- [x] Add AI Front Door tab to MetaLeads page

## Session 2 - Business Updates
- [x] Fix Buba Davis (buba.aragon@gmail.com) to Admin role in DB
- [x] Add Nottingham, England campus to all campus lists
- [x] Update residency/study abroad pricing: $1500 USD (Mérida/Dallas/Denver), £1500 (Nottingham), €1500 (Vienna)
- [x] Add Book Catalog module (60 books for sale)
- [x] Add Travel Abroad / Study Abroad module (3-month programs with passport travel)
- [ ] Update programs: English for Children (5-12), Teens (13-17), Adults (18+), Business English
- [ ] Update Packages & Rates page to reflect real LIOTA pricing
- [x] Update sidebar navigation to include Book Catalog and Travel Abroad
- [ ] Update all campus dropdowns to include Nottingham

## Session 3 - Bilingual Email Templates & Fixes
- [x] Fix LanguageContext TS error (nottingham key missing from Spanish translations)
- [x] Fix StudyAbroad DialogTitle accessibility error
- [x] Email Templates: add EN/ES language toggle to create/edit form
- [x] Email Templates: add Spanish versions of all preset templates
- [x] Email Templates: show language badge (EN/ES) on template cards
- [x] Email Templates: filter templates by language

## Session 4 - Meta Lead Form Sync & Bulk Email Duplication
- [ ] Visit Sports App bulk email page and capture all features
- [ ] Duplicate bulk email page into LIOTA CRM (matching Sports App functionality)
- [ ] Set up Meta Lead Form webhook endpoint for Form ID 1652859402713081
- [ ] Store synced Meta leads in the leads/contacts DB table
- [ ] Add Meta sync status indicator to MetaLeads page
- [ ] Run tests and save checkpoint

## Session 4b - Multi-Channel Outreach Hub
- [ ] Build OutreachHub page with platform credentials/connections table (Email, WhatsApp, Meta, Instagram, TikTok, YouTube, X, LinkedIn)
- [ ] Add bulk send backend procedure with per-message delay timer (5-30s)
- [ ] Build Multi-Channel Compose UI: recipient filters, template selector, channel picker, timer slider, scheduling
- [ ] Add WhatsApp text template sender
- [ ] Add WhatsApp voice memo sender
- [ ] Add send history table with status per recipient per channel
- [ ] Add OutreachHub to sidebar navigation
- [ ] Wire Meta Lead Form sync for Form ID 1652859402713081
- [ ] Add secrets management for all platform API keys

## Session 4c - Placement Test Integration
- [ ] Research Duolingo English Test free demo / embed options
- [x] Add placement test section to Academic Progress page
- [ ] Build built-in CEFR placement quiz (A1-C2) as fallback/supplement
- [ ] Store placement test results per student in DB
- [ ] Send placement test link to new leads via email/WhatsApp

## Session 4d - LIOTA Bills Tracker
- [x] Add recurring_bills table to schema and migrate DB
- [x] Build bills CRUD procedures (create, update, markPaid, disable, list)
- [x] Build reminder check procedure (7/3/1 day before, 3 days overdue)
- [x] Wire notifyOwner for bill reminders
- [x] Build Bills page UI with preset LIOTA bills loaded
- [x] Add Bills to sidebar navigation under Finance
- [x] Seed preset bills for language institute (rent, utilities, software, etc.)

## Panel de Control Finanzas (Bills)
- [x] Procedimiento backend: bills.getMetrics (totales, pendientes, pagados, vencidos, por categoría, por campus)
- [x] KPI cards: Total mensual comprometido, Pendiente de pago, Pagado este mes, Vencido
- [x] Gráfica donut: gastos por categoría (rent, utilities, software, marketing, etc.)
- [x] Gráfica de barras: gastos por campus (Mérida, Dallas, Denver, Vienna, Nottingham, All)
- [x] Lista de próximas facturas (7 días) en el panel
- [x] Totales por moneda (USD/EUR/GBP/MXN) con desglose pendiente/pagado/vencido

## Sistema de Invitaciones (Admin Panel)
- [ ] Tabla invitations en DB (id, email, role, token, status, invitedBy, expiresAt, acceptedAt)
- [ ] Backend: admin.createInvitation (genera token único, envía email con link)
- [ ] Backend: admin.listInvitations (pendientes, aceptadas, expiradas)
- [ ] Backend: admin.revokeInvitation
- [ ] Backend: public.acceptInvitation (valida token, crea/actualiza usuario)
- [ ] Frontend: botón "Invite User" en Admin Panel → Users & Roles
- [ ] Frontend: modal con campo email + selector de rol (admin/user/instructor/coordinator/receptionist)
- [ ] Frontend: tabla de invitaciones pendientes con estado y opción de revocar/reenviar
- [ ] Página pública /invite/:token para que el invitado acepte y acceda al CRM
