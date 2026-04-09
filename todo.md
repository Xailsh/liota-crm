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
- [x] Blur effect on financial figures (visible/intentional)
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
