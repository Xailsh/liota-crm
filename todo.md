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
- [x] Tabla invitations en DB (id, email, role, token, status, invitedBy, expiresAt, acceptedAt)
- [x] Backend: admin.createInvitation (genera token único, envía email con link)
- [x] Backend: admin.listInvitations (pendientes, aceptadas, expiradas)
- [x] Backend: admin.revokeInvitation
- [x] Backend: public.acceptInvitation (valida token, crea/actualiza usuario)
- [x] Frontend: botón "Invite User" en Admin Panel → Users & Roles
- [x] Frontend: modal con campo email + selector de rol (admin/user/instructor/coordinator/receptionist)
- [x] Frontend: tabla de invitaciones pendientes con estado y opción de revocar/reenviar
- [x] Página pública /invite/:token para que el invitado acepte y acceda al CRM

## Resend Email Setup
- [ ] Log into Resend and retrieve API key
- [ ] Add sending domain (languageinstituteoftheamericas.com) in Resend
- [ ] Configure DNS records in Namecheap for Resend domain verification
- [ ] Install Resend SDK (npm package)
- [ ] Add RESEND_API_KEY to project secrets
- [ ] Wire Resend into invitation email sending (admin.createInvitation)
- [ ] Wire Resend into bulk email sending procedure
- [ ] Test invitation email end-to-end
- [ ] Save checkpoint

## Admin Panel - Staff Invitations Fix
- [ ] Restore Permissions tab in Admin Panel
- [ ] Add prominent "Invite Staff" section at top of Users & Roles tab
- [ ] Show invite form (email + role + message) inline without needing a dialog
- [ ] Show pending invitations list with copy link / revoke actions

## Session 5 - Meta Sync, Outreach Hub, WhatsApp Sending

### Meta Lead Form Real Sync
- [x] Add meta_leads table to schema (formId, leadId, fullName, email, phone, source, status, rawData, syncedAt)
- [ ] Build Express webhook endpoint POST /api/meta/webhook (verify token + receive leads) — planned next
- [x] Build tRPC procedures: metaLeads.list, metaLeads.syncFromMeta, metaLeads.stats, metaLeads.updateStatus
- [x] Update MetaLeads page: add Live Leads tab showing synced leads from DB with sync dialog
- [x] Add Meta credentials form to OutreachHub (App ID, App Secret, Page Access Token)
- [ ] Auto-create contact/lead record when Meta lead arrives via webhook — planned next

### Multi-Channel Social Credentials Table
- [x] Add social_credentials table (platform, handle, accessToken, appId, appSecret, status, lastVerified)
- [x] Build tRPC procedures: socialCredentials.list, upsert, delete, updateStatus
- [x] Build OutreachHub page with platform connections table (Email, WhatsApp, Meta, Instagram, TikTok, YouTube, X, LinkedIn)
- [x] Add OutreachHub to sidebar navigation under Integrations & Admin

### WhatsApp Sending from Bulk Outreach
- [ ] Add WhatsApp channel option to BulkEmail/Outreach page — planned next
- [ ] Build backend procedure: outreach.sendWhatsApp (via WhatsApp Business API or Twilio) — planned next
- [ ] Add voice memo upload + send flow in outreach compose panel — planned next
- [x] Add per-message delay timer wired to real backend send (outreach.sendEmail with delayMs)
- [x] Add outreach_messages table with per-recipient status (sent/failed/pending)

### Session 5 Tests
- [x] Vitest: metaLeads.list, stats, RBAC (non-admin blocked from syncFromMeta)
- [x] Vitest: socialCredentials.list, upsert+delete cycle, RBAC (non-admin blocked)
- [x] Vitest: outreach.history, sendEmail invalid email rejection

## Session 6 - Meta Webhook Setup
- [ ] Add META_WEBHOOK_VERIFY_TOKEN secret to project env
- [ ] Add Express route GET /api/meta/webhook (hub.challenge verification)
- [ ] Add Express route POST /api/meta/webhook (receive leadgen events)
- [ ] Parse lead fields from Meta Graph API using page access token from social_credentials
- [ ] Save each lead to meta_leads table (deduplicate by leadId)
- [ ] Auto-create CRM lead record in leads table when Meta lead arrives
- [ ] Show webhook URL in MetaLeads Setup Guide and OutreachHub
- [ ] Write Vitest tests for webhook handler logic
- [ ] Save checkpoint

## Session 7 - Staff Invitations & Multi-Auth Login
- [x] Audit current auth: users table, invitations table, login page, OAuth flow
- [x] Add passwordHash column to users table (for email/password login)
- [x] Add googleId column to users table (for Google OAuth)
- [x] Add avatarUrl column to users table
- [x] Backend: POST /api/staff-auth/set-password (accept invite token + set password → session)
- [x] Backend: POST /api/staff-auth/login (email + password → session cookie)
- [x] Backend: GET /api/staff-auth/google (redirect to Google OAuth)
- [x] Backend: GET /api/staff-auth/google/callback (exchange code, upsert user, issue session)
- [x] Frontend: Login page updated with 3 methods: Manus OAuth, Google Sign-In, Email/Password
- [x] Frontend: /invite/:token page rebuilt — shows invitation details, lets staff choose Google or set password
- [x] Admin Panel → Users & Roles tab already existed with invite form + pending invitations table
- [ ] Wire Google OAuth client credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) — needs user to provide
- [x] Write Vitest tests for new auth procedures (6 tests, all passing)
- [ ] Save checkpoint

## Session 8 - English Placement Test System (COMPLETED)
- [x] Add placement_tests table (title, description, version, targetLevel, durationMinutes, isActive)
- [x] Add test_questions table (questionText, options JSON, correctAnswer, points, skill, cefrLevel, orderIndex)
- [x] Add test_submissions table (token, recipientEmail, recipientName, status, answers JSON, score, cefrResult, sentAt, completedAt, expiresAt)
- [x] Add test_schedules table (studentId, testId, scheduledAt, isRecurring, intervalMonths, nextSendAt, lastSentAt, status)
- [x] Backend: placementTests.list, create, update, delete, getWithQuestions, saveQuestions
- [x] Backend: placementTests.sendToStudent (token, Resend email from contact@liota.institute)
- [x] Backend: placementTests.getByToken (public — validates token, returns test+questions)
- [x] Backend: placementTests.submitAnswers (auto-scores, CEFR map, updates student mcerLevel, saves completedAt)
- [x] Backend: placementTests.listSubmissions, listSchedules, createSchedule, updateSchedule, deleteSchedule, runDueSchedules
- [x] Backend: placementTests.seedDefaults (30-question default A1-C2 test)
- [x] Frontend: PlacementTests admin page (/placement-tests) with 3 tabs: Tests, Scheduler, Submissions
- [x] Frontend: Test builder — create/edit test, question editor with accordion, CEFR/skill tags per question
- [x] Frontend: Send Test dialog — choose existing student or custom email, set expiry days
- [x] Frontend: TakeTest public page (/test/:token) — countdown timer, question navigator, A/B/C/D options, results with CEFR badge
- [x] Frontend: TestScheduler tab — one-time and recurring schedules, pause/resume/delete, Run Due Now
- [x] Frontend: Submissions tab — stats cards, full table with status/CEFR/score/dates
- [x] Sidebar: Placement Tests added under Students group
- [x] Route: /placement-tests and /test/:token registered in App.tsx
- [x] Vitest: 8 tests (list RBAC, invalid token, seed RBAC) — 48 total passing
- [x] Add Placement Tests tab to Student detail page (CEFR badge, test history, send button) — click any student card to open profile sheet
- [x] Save checkpoint (v43b7d7bd)

## Session 9 - Certificate, Analytics & Staff Notes

- [ ] Add submission_notes table (submissionId, authorId, content, createdAt)
- [ ] Add certificateUrl column to test_submissions table
- [ ] Backend: placementTests.generateCertificate (PDF via pdfkit, upload to S3, save URL)
- [ ] Auto-trigger certificate generation when submitAnswers completes
- [ ] Backend: placementTests.getQuestionAnalytics (per-question option distribution across all submissions)
- [ ] Backend: placementTests.addNote, listNotes, deleteNote (staff notes on a submission)
- [ ] Frontend: Submissions tab — add "View Details" button opening a detail panel/dialog
- [ ] Frontend: Detail panel — show per-question analytics (bar chart or option count per A/B/C/D)
- [ ] Frontend: Detail panel — show staff notes thread (add/delete notes, author + timestamp)
- [ ] Frontend: Detail panel — show certificate download link if available
- [ ] Frontend: TakeTest page — show certificate download button after completion
- [ ] Write Vitest tests for new procedures
- [ ] Save checkpoint

## Session 10 - Onboarding Guide
- [x] Add guide_videos table to DB (sectionKey, youtubeUrl, updatedBy, updatedAt)
- [x] Backend: guide.listVideos (public), guide.upsertVideo (admin only)
- [x] Build OnboardingGuide page with role tabs (Instructor, Coordinator/Sales, Finance, Admin)
- [x] Each role tab has sections with step-by-step instructions matching access level
- [x] Each section has YouTube video embed (or placeholder if no URL set yet)
- [x] Admin can click Edit Video to paste a YouTube URL per section
- [x] PDF download button (browser print-to-PDF styled output)
- [x] Add Onboarding Guide to sidebar navigation (Integrations & Admin group)
- [x] Register /onboarding-guide route in App.tsx
- [x] Save checkpoint (v2510a7a5)

## Session 11 - Onboarding Checklists
- [ ] Add onboarding_progress table (userId, role, completedItems JSON, updatedAt)
- [ ] Backend: guide.getProgress (protected, returns current user's completed items)
- [ ] Backend: guide.saveProgress (protected, upsert completed items array)
- [ ] Backend: guide.resetProgress (protected, clear own progress)
- [ ] Frontend: Add checkbox to every checklist item in each role tab
- [ ] Frontend: Overall progress bar per role tab (X of Y steps completed)
- [ ] Frontend: Per-section mini progress indicator (e.g. 2/4 steps done)
- [ ] Frontend: Progress persists across sessions (loaded from DB on mount)
- [ ] Frontend: "Reset Progress" button per tab
- [ ] Frontend: Completed items visually struck-through / greyed out
- [ ] Write Vitest tests for getProgress and saveProgress
- [ ] Save checkpoint

## Session 11b - Sales Role & Permissions
- [ ] Add "sales" to users role enum in schema + migrate
- [ ] Sales role access: Leads Pipeline, Contacts, Email Marketing, Bulk Email, Meta Leads, Placement Tests (send only), Outreach Hub (view only)
- [ ] Sales role blocked from: Financial Dashboard, Accounting, Bills, Admin Panel, Analytics, Staff management
- [ ] Backend: protectedProcedure RBAC guards for finance/admin-only procedures (check sales cannot access)
- [ ] Sidebar: hide Finance group items (Financial Dashboard) from sales role
- [ ] Sidebar: hide Admin Panel from sales role
- [ ] Sidebar: hide Analytics from sales role
- [ ] Admin Panel: add "sales" as selectable role when inviting staff
- [ ] Onboarding Guide: add Sales tab with role-specific instructions
- [ ] Save checkpoint

## Session 12 - Follow-up Tasks
- [ ] Create reusable LIOTA CRM skill via skill-creator
- [ ] Notify admin when staff member completes onboarding checklist (100% progress trigger)
- [ ] Build onboarding progress dashboard for admins (all staff progress table + stats)
- [ ] Allow Sales role to create and edit language packages
- [ ] Write tests for new features
- [ ] Save checkpoint

## Session 13 - Marketing Role
- [x] Add 'marketing' to users role enum in DB and schema.ts
- [x] Add 'marketing' to invitations role enum in DB and schema.ts
- [x] Add 'finance' to users and invitations role enums in DB and schema.ts (migration 0014)
- [x] Backend: allow marketing role on emailCampaigns, contacts, metaLeads, outreach, bulkEmail, packages.list, leads.list, placementTests.sendToStudent
- [x] Sidebar: Marketing sees Email Marketing, Bulk Email, Contacts, Meta Leads, Outreach Hub, Leads Pipeline (read), Language Packages (read), Dashboard, Placement Tests (send only)
- [x] Admin Panel: add Marketing to role SelectItem lists and permissions matrix
- [x] Onboarding Guide: add Marketing tab with 8 sections and checklist items
- [x] Write Vitest tests for Marketing RBAC (21 tests passing)
- [x] Save checkpoint

## Session 14 - Follow-up Tasks

### Rol Ventas
- [x] Add 'ventas' to users and invitations role enums in schema.ts
- [x] Run drizzle-kit generate and apply DB migration for ventas role (migration 0015)
- [x] Backend: allow ventas role on leads (read + write), contacts (read + write), email-marketing, bulk-email, meta-leads, placement tests (send only)
- [x] Sidebar: Ventas sees Leads Pipeline, Contacts, Email Marketing, Bulk Email, Meta Leads, Placement Tests, Language Packages (read), Dashboard, Onboarding Guide
- [x] Admin Panel: add Ventas to role SelectItem lists and permissions matrix column
- [x] Onboarding Guide: add Ventas tab with checklist items
- [x] Write Vitest tests for Ventas RBAC

### Marketing Analytics Dashboard Section
- [x] Frontend: add MarketingAnalytics section to Dashboard page, visible only to marketing and admin roles
- [x] Show: active campaigns count, total leads, conversion rate (leads→students), lead funnel by stage, satisfaction rate

### Email Notifications for Marketing Role
- [x] Backend: extend leads.create procedure with notifyMarketing flag
- [x] Backend: send email via Resend to all marketing users when a lead is created with notifyMarketing=true
- [x] Email template: buildLeadAssignmentEmail with lead name, contact info, stage, source, notes, and CRM link
- [x] Frontend: "Notify Marketing team by email" checkbox in lead creation form (visible to admin/coordinator/sales/ventas)

### Skill Creator
- [x] Read /skill-creator SKILL.md
- [x] Create skill: liota-crm-role at /home/ubuntu/skills/liota-crm-role/SKILL.md

## Session 14b - Onboarding Guide Bilingual Support
- [x] Add EN/ES language toggle button to OnboardingGuide page header
- [x] Add Spanish translations for all role tabs: Admin, Instructor, Coordinator, Finance, Sales, Marketing
- [x] Persist language selection in localStorage so it survives page navigation (via LanguageContext)

## Session 15 - Lead Automation (3 Features)

### Feature 1: Drip Email Sequence
- [x] Add drip_sequences table (name, description, isActive, createdAt)
- [x] Add drip_steps table (sequenceId, dayOffset, subject, bodyHtml, createdAt)
- [x] Add drip_enrollments table (leadId, sequenceId, enrolledAt, currentStep, status, nextSendAt)
- [x] Backend: drip.listSequences, createSequence, updateSequence, deleteSequence
- [x] Backend: drip.listSteps, createStep, updateStep, deleteStep
- [x] Backend: drip.enroll (enroll a lead into a sequence)
- [x] Backend: drip.runDue (send emails for steps that are due, called on a schedule)
- [x] Auto-enroll new Meta leads into default drip sequence on creation
- [x] Auto-enroll new CRM leads into default drip sequence when notifyMarketing=true
- [x] Frontend: Drip Sequences management page with sequence list + step editor
- [x] Seed default LIOTA drip sequence (Day 0: Welcome, Day 3: Programs, Day 7: Free Trial, Day 14: Enroll CTA)
- [x] Add Drip Sequences to sidebar navigation

### Feature 2: Auto-Assign Leads to Marketing + Instant Notification
- [x] Backend: auto-assign new Meta leads to first available marketing user
- [x] Backend: send instant email notification to assigned marketing user on lead creation
- [x] Backend: send in-app notification (notifyOwner) when lead is assigned
- [x] Frontend: show assigned marketing user on lead card in Leads Pipeline

### Feature 3: Embeddable Lead Capture Form
- [x] Build public page /lead-form (no auth required)
- [x] Form fields: First Name, Last Name, Email, Phone, Program of Interest, Campus, How did you hear about us
- [x] On submit: create lead in CRM + auto-enroll in drip sequence + notify marketing team
- [x] Success page after submission
- [x] Generate embed snippet (2-line script tag + div) for external websites
- [x] Add Lead Form management page in CRM (customize fields, view submissions)
- [x] Add to sidebar navigation

## Session 15b - Email Sender Address
- [ ] Update all outgoing emails to send FROM contact@liota.institute
- [ ] Update email.ts default from address
- [ ] Update invitation emails from address
- [ ] Update placement test emails from address
- [ ] Update drip sequence emails from address
- [ ] Update lead notification emails from address

## Session 16 - Pull Meta Leads into CRM

- [x] Backend: tRPC procedure metaLeads.pullLeads(formId) — calls Meta Graph API /formId/leads
- [x] Backend: paginate through all leads (handle cursor-based pagination)
- [x] Backend: map Meta lead fields to CRM leads table (firstName, lastName, email, phone, source="meta_form")
- [x] Backend: skip duplicates (check by email or meta lead ID)
- [x] Backend: metaLeads.listForms — fetch all lead ad forms for the connected page
- [x] Frontend: MetaLeads page — "Pull Leads" button with form selector dropdown
- [x] Frontend: Show import progress (imported X / skipped Y / total Z)
- [x] Frontend: Display pulled leads in a table with name, email, phone, program, date
