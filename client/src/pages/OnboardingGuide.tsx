import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, Download, Edit2, GraduationCap,
  Users2, DollarSign, Shield, Play, RefreshCw, ChevronDown, ChevronRight,
  Zap, Mail, BarChart3, Star, ClipboardList, Megaphone, Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChecklistItem = { key: string; en: string; es: string };
type Section = {
  id: string;
  en: { title: string; description: string };
  es: { title: string; description: string };
  icon: React.ElementType;
  items: ChecklistItem[];
  videoKey: string;
};
type RoleDef = {
  id: string;
  en: string;
  es: string;
  icon: React.ElementType;
  color: string;
  sections: Section[];
};

// ─── Role definitions (bilingual) ─────────────────────────────────────────────
const ROLES: RoleDef[] = [
  {
    id: "instructor",
    en: "Instructor",
    es: "Instructor",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-700",
    sections: [
      {
        id: "inst-login",
        en: { title: "1. Logging In", description: "Access the CRM using your invitation link and set up your account." },
        es: { title: "1. Inicio de Sesión", description: "Accede al CRM usando tu enlace de invitación y configura tu cuenta." },
        icon: Shield,
        videoKey: "instructor-login",
        items: [
          { key: "inst-login-1", en: "Open your invitation email and click the Accept Invitation link", es: "Abre tu correo de invitación y haz clic en el enlace Aceptar Invitación" },
          { key: "inst-login-2", en: "Choose your sign-in method: Google or set an email/password", es: "Elige tu método de acceso: Google o configura un correo/contraseña" },
          { key: "inst-login-3", en: "Confirm your name and complete account setup", es: "Confirma tu nombre y completa la configuración de tu cuenta" },
          { key: "inst-login-4", en: "Bookmark the CRM URL for quick access", es: "Guarda en favoritos la URL del CRM para acceso rápido" },
        ],
      },
      {
        id: "inst-students",
        en: { title: "2. Viewing Students", description: "Browse student profiles and check their enrollment details." },
        es: { title: "2. Ver Estudiantes", description: "Consulta perfiles de estudiantes y revisa sus detalles de inscripción." },
        icon: GraduationCap,
        videoKey: "instructor-students",
        items: [
          { key: "inst-students-1", en: "Navigate to Students in the left sidebar", es: "Ve a Estudiantes en el menú lateral izquierdo" },
          { key: "inst-students-2", en: "Use the search bar to find a student by name", es: "Usa la barra de búsqueda para encontrar un estudiante por nombre" },
          { key: "inst-students-3", en: "Click a student card to open their profile sheet", es: "Haz clic en una tarjeta de estudiante para abrir su perfil" },
          { key: "inst-students-4", en: "Review their CEFR level, program, and enrollment status", es: "Revisa su nivel CEFR, programa y estado de inscripción" },
          { key: "inst-students-5", en: "Check the Placement Tests tab for test history and scores", es: "Revisa la pestaña de Pruebas de Ubicación para ver historial y resultados" },
        ],
      },
      {
        id: "inst-classes",
        en: { title: "3. Managing Classes", description: "View your assigned classes, schedules, and student rosters." },
        es: { title: "3. Gestión de Clases", description: "Consulta tus clases asignadas, horarios y listas de estudiantes." },
        icon: BookOpen,
        videoKey: "instructor-classes",
        items: [
          { key: "inst-classes-1", en: "Go to Classes in the sidebar", es: "Ve a Clases en el menú lateral" },
          { key: "inst-classes-2", en: "Review your class schedule and student count", es: "Revisa tu horario de clases y el número de estudiantes" },
          { key: "inst-classes-3", en: "Check class status (Scheduled / Active / Completed)", es: "Verifica el estado de la clase (Programada / Activa / Completada)" },
          { key: "inst-classes-4", en: "Note the campus and modality (online / onsite) for each class", es: "Anota el campus y modalidad (en línea / presencial) de cada clase" },
        ],
      },
      {
        id: "inst-academic",
        en: { title: "4. Academic Progress", description: "Track student CEFR assessments and learning progress." },
        es: { title: "4. Progreso Académico", description: "Registra evaluaciones CEFR y el avance de aprendizaje de los estudiantes." },
        icon: BarChart3,
        videoKey: "instructor-academic",
        items: [
          { key: "inst-academic-1", en: "Navigate to Academic Progress in the sidebar", es: "Ve a Progreso Académico en el menú lateral" },
          { key: "inst-academic-2", en: "Select a student to view their assessment history", es: "Selecciona un estudiante para ver su historial de evaluaciones" },
          { key: "inst-academic-3", en: "Review speaking, listening, reading, and writing scores", es: "Revisa las puntuaciones de expresión oral, comprensión auditiva, lectura y escritura" },
          { key: "inst-academic-4", en: "Understand the CEFR scale: A1 (beginner) → C2 (mastery)", es: "Entiende la escala CEFR: A1 (principiante) → C2 (dominio)" },
        ],
      },
      {
        id: "inst-placement",
        en: { title: "5. Placement Tests", description: "Send English placement tests and review student results." },
        es: { title: "5. Pruebas de Ubicación", description: "Envía pruebas de ubicación de inglés y revisa los resultados." },
        icon: ClipboardList,
        videoKey: "instructor-placement",
        items: [
          { key: "inst-placement-1", en: "Go to Placement Tests in the sidebar", es: "Ve a Pruebas de Ubicación en el menú lateral" },
          { key: "inst-placement-2", en: "Click Send Test to email a test link to a student", es: "Haz clic en Enviar Prueba para enviar un enlace de prueba por correo" },
          { key: "inst-placement-3", en: "Monitor the Submissions tab to see completed tests", es: "Monitorea la pestaña de Entregas para ver las pruebas completadas" },
          { key: "inst-placement-4", en: "Click Details on a submission to see per-question analytics", es: "Haz clic en Detalles en una entrega para ver el análisis por pregunta" },
          { key: "inst-placement-5", en: "Add internal notes on a submission using the Staff Notes tab", es: "Agrega notas internas en una entrega usando la pestaña Notas del Personal" },
          { key: "inst-placement-6", en: "Download the student's PDF certificate from the submission details", es: "Descarga el certificado PDF del estudiante desde los detalles de la entrega" },
        ],
      },
      {
        id: "inst-templates",
        en: { title: "6. Message Templates", description: "Use pre-built email, WhatsApp, and voice templates for student communication." },
        es: { title: "6. Plantillas de Mensajes", description: "Usa plantillas prediseñadas de correo, WhatsApp y voz para comunicarte con estudiantes." },
        icon: Mail,
        videoKey: "instructor-templates",
        items: [
          { key: "inst-templates-1", en: "Find Email Templates, WhatsApp Templates, and Voice Templates in the sidebar", es: "Encuentra Plantillas de Correo, WhatsApp y Voz en el menú lateral" },
          { key: "inst-templates-2", en: "Browse templates by category (welcome, reminder, progress report)", es: "Explora plantillas por categoría (bienvenida, recordatorio, reporte de progreso)" },
          { key: "inst-templates-3", en: "Copy a template and personalise it before sending", es: "Copia una plantilla y personalízala antes de enviar" },
        ],
      },
    ],
  },
  {
    id: "coordinator",
    en: "Coordinator / Sales",
    es: "Coordinador / Ventas",
    icon: Users2,
    color: "bg-green-100 text-green-700",
    sections: [
      {
        id: "coord-login",
        en: { title: "1. Logging In", description: "Access the CRM using your invitation link." },
        es: { title: "1. Inicio de Sesión", description: "Accede al CRM usando tu enlace de invitación." },
        icon: Shield,
        videoKey: "coordinator-login",
        items: [
          { key: "coord-login-1", en: "Open your invitation email and click the Accept Invitation link", es: "Abre tu correo de invitación y haz clic en Aceptar Invitación" },
          { key: "coord-login-2", en: "Choose Google Sign-In or set an email/password", es: "Elige Google o configura un correo/contraseña" },
          { key: "coord-login-3", en: "Bookmark the CRM URL for quick access", es: "Guarda en favoritos la URL del CRM para acceso rápido" },
        ],
      },
      {
        id: "coord-leads",
        en: { title: "2. Leads Pipeline", description: "Manage prospective students from first contact to enrollment." },
        es: { title: "2. Pipeline de Prospectos", description: "Gestiona prospectos desde el primer contacto hasta la inscripción." },
        icon: Users2,
        videoKey: "coordinator-leads",
        items: [
          { key: "coord-leads-1", en: "Go to Leads Pipeline in the sidebar", es: "Ve a Pipeline de Prospectos en el menú lateral" },
          { key: "coord-leads-2", en: "Understand the 7 pipeline stages: New Lead → Enrolled / Lost", es: "Entiende las 7 etapas: Nuevo Prospecto → Inscrito / Perdido" },
          { key: "coord-leads-3", en: "Click Add Lead to manually enter a new prospect", es: "Haz clic en Agregar Prospecto para ingresar uno nuevo manualmente" },
          { key: "coord-leads-4", en: "Drag a lead card to move it to the next stage", es: "Arrastra una tarjeta de prospecto para moverla a la siguiente etapa" },
          { key: "coord-leads-5", en: "Click a lead to edit details, add notes, or schedule a trial", es: "Haz clic en un prospecto para editar detalles, agregar notas o programar una clase de prueba" },
          { key: "coord-leads-6", en: "Set the Assigned To field to track ownership", es: "Establece el campo Asignado a para rastrear la responsabilidad" },
        ],
      },
      {
        id: "coord-contacts",
        en: { title: "3. Contacts", description: "Manage parents, guardians, and prospective student contacts." },
        es: { title: "3. Contactos", description: "Gestiona padres, tutores y contactos de estudiantes potenciales." },
        icon: Users2,
        videoKey: "coordinator-contacts",
        items: [
          { key: "coord-contacts-1", en: "Navigate to Contacts in the sidebar", es: "Ve a Contactos en el menú lateral" },
          { key: "coord-contacts-2", en: "Add a new contact with name, email, phone, and relationship", es: "Agrega un nuevo contacto con nombre, correo, teléfono y relación" },
          { key: "coord-contacts-3", en: "Link contacts to student records where applicable", es: "Vincula contactos a registros de estudiantes cuando corresponda" },
          { key: "coord-contacts-4", en: "Use the search bar to find contacts quickly", es: "Usa la barra de búsqueda para encontrar contactos rápidamente" },
        ],
      },
      {
        id: "coord-email",
        en: { title: "4. Email Marketing", description: "Create and send email campaigns to students and leads." },
        es: { title: "4. Email Marketing", description: "Crea y envía campañas de correo a estudiantes y prospectos." },
        icon: Mail,
        videoKey: "coordinator-email",
        items: [
          { key: "coord-email-1", en: "Go to Email Marketing in the sidebar", es: "Ve a Email Marketing en el menú lateral" },
          { key: "coord-email-2", en: "Click New Campaign and fill in subject, body, and audience segment", es: "Haz clic en Nueva Campaña y completa asunto, cuerpo y segmento de audiencia" },
          { key: "coord-email-3", en: "Use the Send Test button to preview before sending", es: "Usa el botón Enviar Prueba para previsualizar antes de enviar" },
          { key: "coord-email-4", en: "Schedule or send immediately; monitor open and click rates", es: "Programa o envía de inmediato; monitorea tasas de apertura y clics" },
        ],
      },
      {
        id: "coord-bulk",
        en: { title: "5. Bulk Email / Outreach", description: "Send mass personalised emails with delay timers to avoid spam filters." },
        es: { title: "5. Correo Masivo / Outreach", description: "Envía correos masivos personalizados con temporizadores para evitar filtros de spam." },
        icon: Zap,
        videoKey: "coordinator-bulk",
        items: [
          { key: "coord-bulk-1", en: "Go to Bulk Email in the sidebar", es: "Ve a Correo Masivo en el menú lateral" },
          { key: "coord-bulk-2", en: "Compose your message and select recipients (students or leads)", es: "Redacta tu mensaje y selecciona destinatarios (estudiantes o prospectos)" },
          { key: "coord-bulk-3", en: "Set the per-message delay (5–30 seconds) to avoid spam detection", es: "Establece el retraso por mensaje (5–30 segundos) para evitar detección de spam" },
          { key: "coord-bulk-4", en: "Click Send to All — monitor the live status log", es: "Haz clic en Enviar a Todos — monitorea el registro de estado en tiempo real" },
          { key: "coord-bulk-5", en: "Review send history in the Outreach History tab", es: "Revisa el historial de envíos en la pestaña Historial de Outreach" },
        ],
      },
      {
        id: "coord-meta",
        en: { title: "6. Meta Leads", description: "View and manage leads captured from Facebook and Instagram forms." },
        es: { title: "6. Meta Leads", description: "Ve y gestiona prospectos capturados desde formularios de Facebook e Instagram." },
        icon: Star,
        videoKey: "coordinator-meta",
        items: [
          { key: "coord-meta-1", en: "Go to Meta Leads in the sidebar", es: "Ve a Meta Leads en el menú lateral" },
          { key: "coord-meta-2", en: "Review the Live Leads tab for synced Facebook/Instagram leads", es: "Revisa la pestaña Leads en Vivo para prospectos sincronizados de Facebook/Instagram" },
          { key: "coord-meta-3", en: "Update lead status (New / Contacted / Qualified / Enrolled / Lost)", es: "Actualiza el estado del prospecto (Nuevo / Contactado / Calificado / Inscrito / Perdido)" },
          { key: "coord-meta-4", en: "Use Sync from Meta to pull the latest leads manually", es: "Usa Sincronizar desde Meta para obtener los últimos prospectos manualmente" },
        ],
      },
      {
        id: "coord-placement",
        en: { title: "7. Placement Tests", description: "Send English placement tests to leads and new students." },
        es: { title: "7. Pruebas de Ubicación", description: "Envía pruebas de ubicación de inglés a prospectos y nuevos estudiantes." },
        icon: ClipboardList,
        videoKey: "coordinator-placement",
        items: [
          { key: "coord-placement-1", en: "Go to Placement Tests in the sidebar", es: "Ve a Pruebas de Ubicación en el menú lateral" },
          { key: "coord-placement-2", en: "Click Send Test and enter the student's email", es: "Haz clic en Enviar Prueba e ingresa el correo del estudiante" },
          { key: "coord-placement-3", en: "Set the expiry window (e.g. 7 days)", es: "Establece la ventana de vencimiento (ej. 7 días)" },
          { key: "coord-placement-4", en: "Monitor the Submissions tab for completed results", es: "Monitorea la pestaña de Entregas para ver resultados completados" },
          { key: "coord-placement-5", en: "Set up recurring test schedules in the Scheduler tab", es: "Configura horarios recurrentes de pruebas en la pestaña Programador" },
        ],
      },
    ],
  },
  {
    id: "sales",
    en: "Sales",
    es: "Ventas",
    icon: Star,
    color: "bg-orange-100 text-orange-700",
    sections: [
      {
        id: "sales-login",
        en: { title: "1. Logging In & Your Access", description: "Sign in and understand what you can access as a Sales team member." },
        es: { title: "1. Inicio de Sesión y Tu Acceso", description: "Inicia sesión y comprende a qué puedes acceder como miembro del equipo de Ventas." },
        icon: Shield,
        videoKey: "sales-login",
        items: [
          { key: "sales-login-1", en: "Open your invitation email and click the Accept Invitation link", es: "Abre tu correo de invitación y haz clic en Aceptar Invitación" },
          { key: "sales-login-2", en: "Choose Google Sign-In or set an email/password", es: "Elige Google o configura un correo/contraseña" },
          { key: "sales-login-3", en: "Your access: Leads, Contacts, Email Marketing, Bulk Email, Meta Leads, Placement Tests", es: "Tu acceso: Prospectos, Contactos, Email Marketing, Correo Masivo, Meta Leads, Pruebas de Ubicación" },
          { key: "sales-login-4", en: "Finance, Admin Panel, and Analytics are not accessible to your role", es: "Finanzas, Panel de Admin y Analíticas no son accesibles para tu rol" },
          { key: "sales-login-5", en: "Bookmark the CRM URL for quick access", es: "Guarda en favoritos la URL del CRM para acceso rápido" },
        ],
      },
      {
        id: "sales-leads",
        en: { title: "2. Leads Pipeline — Your Primary Tool", description: "The leads pipeline is your main workspace. Track every prospect from first contact to enrollment." },
        es: { title: "2. Pipeline de Prospectos — Tu Herramienta Principal", description: "El pipeline de prospectos es tu espacio de trabajo principal. Rastrea cada prospecto desde el primer contacto hasta la inscripción." },
        icon: Users2,
        videoKey: "sales-leads",
        items: [
          { key: "sales-leads-1", en: "Go to Leads Pipeline in the sidebar", es: "Ve a Pipeline de Prospectos en el menú lateral" },
          { key: "sales-leads-2", en: "Understand the 7 stages: New Lead → Contacted → Trial Scheduled → Trial Done → Proposal Sent → Enrolled → Lost", es: "Entiende las 7 etapas: Nuevo Prospecto → Contactado → Prueba Programada → Prueba Realizada → Propuesta Enviada → Inscrito → Perdido" },
          { key: "sales-leads-3", en: "Add a new lead manually with Add Lead button", es: "Agrega un nuevo prospecto manualmente con el botón Agregar Prospecto" },
          { key: "sales-leads-4", en: "Drag lead cards between columns to update their stage", es: "Arrastra tarjetas de prospectos entre columnas para actualizar su etapa" },
          { key: "sales-leads-5", en: "Click a lead to add notes, set trial date, and assign to yourself", es: "Haz clic en un prospecto para agregar notas, establecer fecha de prueba y asignártelo" },
          { key: "sales-leads-6", en: "Always update the stage after each interaction — this drives your pipeline metrics", es: "Siempre actualiza la etapa después de cada interacción — esto impulsa tus métricas de pipeline" },
        ],
      },
      {
        id: "sales-contacts",
        en: { title: "3. Contacts", description: "Keep parent and student contact information organised." },
        es: { title: "3. Contactos", description: "Mantén organizada la información de contacto de padres y estudiantes." },
        icon: Users2,
        videoKey: "sales-contacts",
        items: [
          { key: "sales-contacts-1", en: "Go to Contacts in the sidebar", es: "Ve a Contactos en el menú lateral" },
          { key: "sales-contacts-2", en: "Add parents, guardians, or adult students as contacts", es: "Agrega padres, tutores o estudiantes adultos como contactos" },
          { key: "sales-contacts-3", en: "Always include email and phone for follow-up", es: "Siempre incluye correo y teléfono para seguimiento" },
          { key: "sales-contacts-4", en: "Link contacts to their student record when available", es: "Vincula contactos a su registro de estudiante cuando esté disponible" },
        ],
      },
      {
        id: "sales-meta",
        en: { title: "4. Meta Leads (Facebook & Instagram)", description: "Leads from your Facebook and Instagram ads land here automatically." },
        es: { title: "4. Meta Leads (Facebook e Instagram)", description: "Los prospectos de tus anuncios de Facebook e Instagram llegan aquí automáticamente." },
        icon: Star,
        videoKey: "sales-meta",
        items: [
          { key: "sales-meta-1", en: "Go to Meta Leads in the sidebar", es: "Ve a Meta Leads en el menú lateral" },
          { key: "sales-meta-2", en: "New leads from Facebook/Instagram forms appear in the Live Leads tab", es: "Los nuevos prospectos de formularios de Facebook/Instagram aparecen en la pestaña Leads en Vivo" },
          { key: "sales-meta-3", en: "Contact each new lead within 24 hours — update status to Contacted", es: "Contacta cada nuevo prospecto en 24 horas — actualiza el estado a Contactado" },
          { key: "sales-meta-4", en: "Move qualified leads into the Leads Pipeline for full tracking", es: "Mueve los prospectos calificados al Pipeline de Prospectos para seguimiento completo" },
          { key: "sales-meta-5", en: "Use Sync from Meta if you don't see a recent lead", es: "Usa Sincronizar desde Meta si no ves un prospecto reciente" },
        ],
      },
      {
        id: "sales-email",
        en: { title: "5. Email Outreach", description: "Send follow-up emails and campaigns to your leads." },
        es: { title: "5. Outreach por Correo", description: "Envía correos de seguimiento y campañas a tus prospectos." },
        icon: Mail,
        videoKey: "sales-email",
        items: [
          { key: "sales-email-1", en: "Use Email Marketing for scheduled campaigns to your lead list", es: "Usa Email Marketing para campañas programadas a tu lista de prospectos" },
          { key: "sales-email-2", en: "Use Bulk Email for personalised one-to-many outreach with delay timers", es: "Usa Correo Masivo para outreach personalizado uno-a-muchos con temporizadores de retraso" },
          { key: "sales-email-3", en: "Always use the Send Test button before sending to your full list", es: "Siempre usa el botón Enviar Prueba antes de enviar a tu lista completa" },
          { key: "sales-email-4", en: "Check the Outreach History tab to confirm delivery status", es: "Revisa la pestaña Historial de Outreach para confirmar el estado de entrega" },
        ],
      },
      {
        id: "sales-placement",
        en: { title: "6. Sending Placement Tests", description: "Send placement tests to new leads to qualify their English level before enrollment." },
        es: { title: "6. Envío de Pruebas de Ubicación", description: "Envía pruebas de ubicación a nuevos prospectos para calificar su nivel de inglés antes de la inscripción." },
        icon: ClipboardList,
        videoKey: "sales-placement",
        items: [
          { key: "sales-placement-1", en: "Go to Placement Tests in the sidebar", es: "Ve a Pruebas de Ubicación en el menú lateral" },
          { key: "sales-placement-2", en: "Click Send Test and enter the lead's email address", es: "Haz clic en Enviar Prueba e ingresa el correo del prospecto" },
          { key: "sales-placement-3", en: "The lead receives a timed test link by email", es: "El prospecto recibe un enlace de prueba cronometrada por correo" },
          { key: "sales-placement-4", en: "Check the Submissions tab to see their CEFR result", es: "Revisa la pestaña de Entregas para ver su resultado CEFR" },
          { key: "sales-placement-5", en: "Use the CEFR result to recommend the right program level", es: "Usa el resultado CEFR para recomendar el nivel de programa adecuado" },
        ],
      },
      {
        id: "sales-tips",
        en: { title: "7. Sales Best Practices", description: "Key habits to maximise your conversion rate using the CRM." },
        es: { title: "7. Mejores Prácticas de Ventas", description: "Hábitos clave para maximizar tu tasa de conversión usando el CRM." },
        icon: Star,
        videoKey: "sales-tips",
        items: [
          { key: "sales-tips-1", en: "Update every lead's stage after each call or email — never leave it stale", es: "Actualiza la etapa de cada prospecto después de cada llamada o correo — nunca la dejes desactualizada" },
          { key: "sales-tips-2", en: "Add a note to every lead interaction (date, what was discussed, next step)", es: "Agrega una nota a cada interacción con el prospecto (fecha, qué se discutió, siguiente paso)" },
          { key: "sales-tips-3", en: "Send a placement test to every new lead within 48 hours of first contact", es: "Envía una prueba de ubicación a cada nuevo prospecto dentro de las 48 horas del primer contacto" },
          { key: "sales-tips-4", en: "Follow up with a trial class offer once you have their CEFR result", es: "Haz seguimiento con una oferta de clase de prueba una vez que tengas su resultado CEFR" },
          { key: "sales-tips-5", en: "Use the Bulk Email delay timer (10–15s) to avoid spam filters on mass outreach", es: "Usa el temporizador de retraso de Correo Masivo (10–15s) para evitar filtros de spam en outreach masivo" },
          { key: "sales-tips-6", en: "Check Meta Leads every morning for overnight Facebook/Instagram form submissions", es: "Revisa Meta Leads cada mañana para ver envíos de formularios de Facebook/Instagram durante la noche" },
        ],
      },
    ],
  },
  {
    id: "marketing",
    en: "Marketing",
    es: "Marketing",
    icon: Megaphone,
    color: "bg-pink-100 text-pink-700",
    sections: [
      {
        id: "mkt-login",
        en: { title: "1. Logging In & Your Access", description: "Sign in and understand what you can access as a Marketing team member." },
        es: { title: "1. Inicio de Sesión y Tu Acceso", description: "Inicia sesión y comprende a qué puedes acceder como miembro del equipo de Marketing." },
        icon: Shield,
        videoKey: "marketing-login",
        items: [
          { key: "mkt-login-1", en: "Open your invitation email and click the Accept Invitation link", es: "Abre tu correo de invitación y haz clic en Aceptar Invitación" },
          { key: "mkt-login-2", en: "Choose Google Sign-In or set an email/password", es: "Elige Google o configura un correo/contraseña" },
          { key: "mkt-login-3", en: "Your access: Leads, Contacts (read), Email Marketing, Bulk Email, Meta Leads, Outreach Hub, Email & WhatsApp Templates", es: "Tu acceso: Prospectos, Contactos (lectura), Email Marketing, Correo Masivo, Meta Leads, Outreach Hub, Plantillas de Correo y WhatsApp" },
          { key: "mkt-login-4", en: "Finance, Admin Panel, Students, and Classes are not accessible to your role", es: "Finanzas, Panel de Admin, Estudiantes y Clases no son accesibles para tu rol" },
          { key: "mkt-login-5", en: "Bookmark the CRM URL for quick access", es: "Guarda en favoritos la URL del CRM para acceso rápido" },
        ],
      },
      {
        id: "mkt-leads",
        en: { title: "2. Viewing Leads", description: "Monitor the leads pipeline to understand inbound interest and campaign performance." },
        es: { title: "2. Ver Prospectos", description: "Monitorea el pipeline de prospectos para entender el interés entrante y el rendimiento de campañas." },
        icon: Users2,
        videoKey: "marketing-leads",
        items: [
          { key: "mkt-leads-1", en: "Go to Leads Pipeline in the sidebar", es: "Ve a Pipeline de Prospectos en el menú lateral" },
          { key: "mkt-leads-2", en: "Understand the 7 stages: New Lead → Contacted → Trial Scheduled → Trial Done → Proposal Sent → Enrolled → Lost", es: "Entiende las 7 etapas: Nuevo Prospecto → Contactado → Prueba Programada → Prueba Realizada → Propuesta Enviada → Inscrito → Perdido" },
          { key: "mkt-leads-3", en: "Drag lead cards between columns to update their stage", es: "Arrastra tarjetas de prospectos entre columnas para actualizar su etapa" },
          { key: "mkt-leads-4", en: "Add notes and follow-up dates to leads you manage", es: "Agrega notas y fechas de seguimiento a los prospectos que gestionas" },
          { key: "mkt-leads-5", en: "Coordinate with Sales to hand off qualified leads for follow-up", es: "Coordina con Ventas para transferir prospectos calificados para seguimiento" },
        ],
      },
      {
        id: "mkt-email",
        en: { title: "3. Email Marketing Campaigns", description: "Create and send targeted email campaigns to leads and contacts." },
        es: { title: "3. Campañas de Email Marketing", description: "Crea y envía campañas de correo dirigidas a prospectos y contactos." },
        icon: Mail,
        videoKey: "marketing-email",
        items: [
          { key: "mkt-email-1", en: "Go to Email Marketing in the sidebar", es: "Ve a Email Marketing en el menú lateral" },
          { key: "mkt-email-2", en: "Create a new campaign with a clear subject line and goal", es: "Crea una nueva campaña con un asunto claro y un objetivo definido" },
          { key: "mkt-email-3", en: "Select recipients from leads, contacts, or a custom list", es: "Selecciona destinatarios de prospectos, contactos o una lista personalizada" },
          { key: "mkt-email-4", en: "Preview the email before sending and test on mobile", es: "Previsualiza el correo antes de enviar y prueba en móvil" },
          { key: "mkt-email-5", en: "Schedule campaigns for optimal send times (Tue–Thu, 9–11 AM)", es: "Programa campañas en horarios óptimos de envío (Mar–Jue, 9–11 AM)" },
          { key: "mkt-email-6", en: "Review open rates and click-through rates after sending", es: "Revisa las tasas de apertura y clics después de enviar" },
        ],
      },
      {
        id: "mkt-bulk",
        en: { title: "4. Bulk Email & Outreach", description: "Send mass outreach to large contact lists efficiently." },
        es: { title: "4. Correo Masivo y Outreach", description: "Envía outreach masivo a grandes listas de contactos de forma eficiente." },
        icon: Zap,
        videoKey: "marketing-bulk",
        items: [
          { key: "mkt-bulk-1", en: "Go to Bulk Email in the sidebar", es: "Ve a Correo Masivo en el menú lateral" },
          { key: "mkt-bulk-2", en: "Upload or select a recipient list (CSV or from contacts)", es: "Sube o selecciona una lista de destinatarios (CSV o desde contactos)" },
          { key: "mkt-bulk-3", en: "Choose or create an email template", es: "Elige o crea una plantilla de correo" },
          { key: "mkt-bulk-4", en: "Set a send delay of 10–15 seconds between emails to avoid spam filters", es: "Establece un retraso de envío de 10–15 segundos entre correos para evitar filtros de spam" },
          { key: "mkt-bulk-5", en: "Monitor delivery status and unsubscribe requests", es: "Monitorea el estado de entrega y las solicitudes de baja" },
        ],
      },
      {
        id: "mkt-meta",
        en: { title: "5. Meta Leads (Facebook & Instagram)", description: "Capture and process leads from Facebook and Instagram ad forms." },
        es: { title: "5. Meta Leads (Facebook e Instagram)", description: "Captura y procesa prospectos de formularios de anuncios de Facebook e Instagram." },
        icon: Star,
        videoKey: "marketing-meta",
        items: [
          { key: "mkt-meta-1", en: "Go to Meta Leads in the sidebar", es: "Ve a Meta Leads en el menú lateral" },
          { key: "mkt-meta-2", en: "New leads from Facebook/Instagram forms appear in the Live Leads tab", es: "Los nuevos prospectos de formularios de Facebook/Instagram aparecen en la pestaña Leads en Vivo" },
          { key: "mkt-meta-3", en: "Contact each new lead within 24 hours — update status to Contacted", es: "Contacta cada nuevo prospecto en 24 horas — actualiza el estado a Contactado" },
          { key: "mkt-meta-4", en: "Move qualified leads into the Leads Pipeline for full tracking", es: "Mueve los prospectos calificados al Pipeline de Prospectos para seguimiento completo" },
          { key: "mkt-meta-5", en: "Use Sync from Meta if you don't see a recent lead", es: "Usa Sincronizar desde Meta si no ves un prospecto reciente" },
          { key: "mkt-meta-6", en: "Check Meta Leads every morning for overnight form submissions", es: "Revisa Meta Leads cada mañana para ver envíos de formularios durante la noche" },
        ],
      },
      {
        id: "mkt-outreach",
        en: { title: "6. Outreach Hub (Social Media)", description: "Connect and manage social media accounts for automated outreach." },
        es: { title: "6. Outreach Hub (Redes Sociales)", description: "Conecta y gestiona cuentas de redes sociales para outreach automatizado." },
        icon: BarChart3,
        videoKey: "marketing-outreach",
        items: [
          { key: "mkt-outreach-1", en: "Go to Outreach Hub in the sidebar", es: "Ve a Outreach Hub en el menú lateral" },
          { key: "mkt-outreach-2", en: "Connect your Facebook, Instagram, or WhatsApp Business accounts", es: "Conecta tus cuentas de Facebook, Instagram o WhatsApp Business" },
          { key: "mkt-outreach-3", en: "Schedule posts and messages directly from the CRM", es: "Programa publicaciones y mensajes directamente desde el CRM" },
          { key: "mkt-outreach-4", en: "Monitor engagement metrics and respond to messages", es: "Monitorea métricas de engagement y responde a mensajes" },
          { key: "mkt-outreach-5", en: "Use templates for consistent brand messaging across channels", es: "Usa plantillas para mensajes de marca consistentes en todos los canales" },
        ],
      },
      {
        id: "mkt-templates",
        en: { title: "7. Email & WhatsApp Templates", description: "Manage reusable message templates for all marketing channels." },
        es: { title: "7. Plantillas de Correo y WhatsApp", description: "Gestiona plantillas de mensajes reutilizables para todos los canales de marketing." },
        icon: ClipboardList,
        videoKey: "marketing-templates",
        items: [
          { key: "mkt-templates-1", en: "Go to Email Templates or WhatsApp Templates in the sidebar", es: "Ve a Plantillas de Correo o Plantillas de WhatsApp en el menú lateral" },
          { key: "mkt-templates-2", en: "Create templates for common campaigns: enrollment promos, trial invitations, follow-ups", es: "Crea plantillas para campañas comunes: promos de inscripción, invitaciones de prueba, seguimientos" },
          { key: "mkt-templates-3", en: "Use {{first_name}} and {{campus}} placeholders for personalization", es: "Usa los marcadores {{first_name}} y {{campus}} para personalización" },
          { key: "mkt-templates-4", en: "Keep subject lines under 50 characters for better open rates", es: "Mantén los asuntos con menos de 50 caracteres para mejores tasas de apertura" },
          { key: "mkt-templates-5", en: "Archive outdated templates to keep the library clean", es: "Archiva plantillas desactualizadas para mantener la biblioteca ordenada" },
        ],
      },
      {
        id: "mkt-tips",
        en: { title: "8. Marketing Best Practices", description: "Key habits and tips to maximize your marketing effectiveness." },
        es: { title: "8. Mejores Prácticas de Marketing", description: "Hábitos y consejos clave para maximizar la efectividad de tu marketing." },
        icon: Star,
        videoKey: "marketing-tips",
        items: [
          { key: "mkt-tips-1", en: "Always A/B test subject lines on large campaigns (split 20% of list)", es: "Siempre haz pruebas A/B de asuntos en campañas grandes (divide el 20% de la lista)" },
          { key: "mkt-tips-2", en: "Segment your audience: children parents, adult learners, business professionals", es: "Segmenta tu audiencia: padres de niños, adultos aprendices, profesionales de negocios" },
          { key: "mkt-tips-3", en: "Coordinate campaign timing with Sales team to avoid lead overload", es: "Coordina el tiempo de las campañas con el equipo de Ventas para evitar sobrecarga de prospectos" },
          { key: "mkt-tips-4", en: "Use the Bulk Email delay timer (10–15s) to avoid spam filters on mass outreach", es: "Usa el temporizador de retraso de Correo Masivo (10–15s) para evitar filtros de spam" },
          { key: "mkt-tips-5", en: "Check Meta Leads every morning for overnight Facebook/Instagram form submissions", es: "Revisa Meta Leads cada mañana para ver envíos de formularios durante la noche" },
          { key: "mkt-tips-6", en: "Review campaign analytics weekly and adjust messaging based on performance", es: "Revisa las analíticas de campañas semanalmente y ajusta el mensaje según el rendimiento" },
        ],
      },
    ],
  },
  {
    id: "finance",
    en: "Finance",
    es: "Finanzas",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-700",
    sections: [
      {
        id: "fin-login",
        en: { title: "1. Logging In", description: "Access the CRM using your invitation link." },
        es: { title: "1. Inicio de Sesión", description: "Accede al CRM usando tu enlace de invitación." },
        icon: Shield,
        videoKey: "finance-login",
        items: [
          { key: "fin-login-1", en: "Open your invitation email and click the Accept Invitation link", es: "Abre tu correo de invitación y haz clic en Aceptar Invitación" },
          { key: "fin-login-2", en: "Choose Google Sign-In or set an email/password", es: "Elige Google o configura un correo/contraseña" },
          { key: "fin-login-3", en: "Bookmark the CRM URL for quick access", es: "Guarda en favoritos la URL del CRM para acceso rápido" },
        ],
      },
      {
        id: "fin-accounting",
        en: { title: "2. Accounting — Payments", description: "Record and track student payments." },
        es: { title: "2. Contabilidad — Pagos", description: "Registra y rastrea los pagos de estudiantes." },
        icon: DollarSign,
        videoKey: "finance-accounting",
        items: [
          { key: "fin-accounting-1", en: "Go to Accounting in the sidebar", es: "Ve a Contabilidad en el menú lateral" },
          { key: "fin-accounting-2", en: "Click Add Payment to record a new student payment", es: "Haz clic en Agregar Pago para registrar un nuevo pago de estudiante" },
          { key: "fin-accounting-3", en: "Select the student, amount, currency, and payment method", es: "Selecciona el estudiante, monto, moneda y método de pago" },
          { key: "fin-accounting-4", en: "Set status to Completed once payment is confirmed", es: "Establece el estado en Completado una vez confirmado el pago" },
          { key: "fin-accounting-5", en: "Add an invoice number for reference", es: "Agrega un número de factura para referencia" },
          { key: "fin-accounting-6", en: "Use the filter bar to view payments by campus or status", es: "Usa la barra de filtros para ver pagos por campus o estado" },
        ],
      },
      {
        id: "fin-bills",
        en: { title: "3. Bills & Expenses", description: "Track recurring bills and operational expenses." },
        es: { title: "3. Facturas y Gastos", description: "Rastrea facturas recurrentes y gastos operativos." },
        icon: DollarSign,
        videoKey: "finance-bills",
        items: [
          { key: "fin-bills-1", en: "Go to Bills & Expenses in the sidebar", es: "Ve a Facturas y Gastos en el menú lateral" },
          { key: "fin-bills-2", en: "Add recurring bills (rent, utilities, software subscriptions)", es: "Agrega facturas recurrentes (renta, servicios, suscripciones de software)" },
          { key: "fin-bills-3", en: "Set due dates and mark bills as paid when settled", es: "Establece fechas de vencimiento y marca las facturas como pagadas cuando se liquiden" },
          { key: "fin-bills-4", en: "Review the Bills Due Soon alert to avoid missed payments", es: "Revisa la alerta de Facturas Próximas a Vencer para evitar pagos perdidos" },
          { key: "fin-bills-5", en: "Add one-time expenses with category and campus tags", es: "Agrega gastos únicos con etiquetas de categoría y campus" },
        ],
      },
      {
        id: "fin-dashboard",
        en: { title: "4. Financial Dashboard", description: "View revenue, expenses, and net profit across all campuses." },
        es: { title: "4. Panel Financiero", description: "Ve ingresos, gastos y utilidad neta en todos los campus." },
        icon: BarChart3,
        videoKey: "finance-dashboard",
        items: [
          { key: "fin-dashboard-1", en: "Go to Financial Dashboard in the sidebar (admin/finance only)", es: "Ve al Panel Financiero en el menú lateral (solo admin/finanzas)" },
          { key: "fin-dashboard-2", en: "Review Total Revenue, Pending Collections, Total Expenses, and Net Profit", es: "Revisa Ingresos Totales, Cobros Pendientes, Gastos Totales y Utilidad Neta" },
          { key: "fin-dashboard-3", en: "Use the campus filter to view per-location financials", es: "Usa el filtro de campus para ver las finanzas por ubicación" },
          { key: "fin-dashboard-4", en: "Check the Revenue by Program chart for program performance", es: "Revisa la gráfica de Ingresos por Programa para ver el rendimiento de cada programa" },
          { key: "fin-dashboard-5", en: "Export or screenshot the dashboard for monthly reporting", es: "Exporta o captura el panel para reportes mensuales" },
        ],
      },
      {
        id: "fin-scholarships",
        en: { title: "5. Scholarships & Packages", description: "Manage financial aid and language package pricing." },
        es: { title: "5. Becas y Paquetes", description: "Gestiona ayudas financieras y precios de paquetes de idiomas." },
        icon: Star,
        videoKey: "finance-scholarships",
        items: [
          { key: "fin-scholarships-1", en: "Go to Scholarships in the sidebar to view and create financial aid records", es: "Ve a Becas en el menú lateral para ver y crear registros de ayuda financiera" },
          { key: "fin-scholarships-2", en: "Go to Language Packages to review and update program pricing", es: "Ve a Paquetes de Idiomas para revisar y actualizar los precios de programas" },
          { key: "fin-scholarships-3", en: "Coordinate with admin before changing package prices", es: "Coordina con el admin antes de cambiar los precios de paquetes" },
        ],
      },
    ],
  },
  {
    id: "admin",
    en: "Admin",
    es: "Administrador",
    icon: Shield,
    color: "bg-purple-100 text-purple-700",
    sections: [
      {
        id: "admin-login",
        en: { title: "1. Logging In", description: "Access the CRM as an administrator." },
        es: { title: "1. Inicio de Sesión", description: "Accede al CRM como administrador." },
        icon: Shield,
        videoKey: "admin-login",
        items: [
          { key: "admin-login-1", en: "Sign in with your Manus account (primary admin method) or Google", es: "Inicia sesión con tu cuenta Manus (método principal de admin) o Google" },
          { key: "admin-login-2", en: "Confirm your role badge shows Admin in the sidebar", es: "Confirma que tu insignia de rol muestre Admin en el menú lateral" },
          { key: "admin-login-3", en: "You have access to all modules including Finance, Admin Panel, and Analytics", es: "Tienes acceso a todos los módulos incluyendo Finanzas, Panel de Admin y Analíticas" },
        ],
      },
      {
        id: "admin-staff",
        en: { title: "2. Inviting Staff Members", description: "Add new team members and assign their roles." },
        es: { title: "2. Invitar Miembros del Personal", description: "Agrega nuevos miembros del equipo y asigna sus roles." },
        icon: Users2,
        videoKey: "admin-staff",
        items: [
          { key: "admin-staff-1", en: "Go to Admin Panel → Users & Roles tab", es: "Ve al Panel de Admin → pestaña Usuarios y Roles" },
          { key: "admin-staff-2", en: "Click Invite Staff Member and enter their email", es: "Haz clic en Invitar Miembro del Personal e ingresa su correo" },
          { key: "admin-staff-3", en: "Select their role: Instructor, Coordinator, Sales, Marketing, Finance, or Admin", es: "Selecciona su rol: Instructor, Coordinador, Ventas, Marketing, Finanzas o Admin" },
          { key: "admin-staff-4", en: "They receive an email with an invitation link", es: "Recibirán un correo con un enlace de invitación" },
          { key: "admin-staff-5", en: "Monitor the Pending Invitations table to track acceptance", es: "Monitorea la tabla de Invitaciones Pendientes para rastrear la aceptación" },
          { key: "admin-staff-6", en: "Revoke an invitation if needed before it is accepted", es: "Revoca una invitación si es necesario antes de que sea aceptada" },
        ],
      },
      {
        id: "admin-placement",
        en: { title: "3. Placement Tests — Full Control", description: "Create test versions, seed defaults, and manage the scheduler." },
        es: { title: "3. Pruebas de Ubicación — Control Total", description: "Crea versiones de pruebas, carga valores predeterminados y gestiona el programador." },
        icon: ClipboardList,
        videoKey: "admin-placement",
        items: [
          { key: "admin-placement-1", en: "Go to Placement Tests → click Seed Default Test to load the 30-question A1–C2 test", es: "Ve a Pruebas de Ubicación → haz clic en Cargar Prueba Predeterminada para cargar la prueba de 30 preguntas A1–C2" },
          { key: "admin-placement-2", en: "Create custom test versions with the + New Test button", es: "Crea versiones de prueba personalizadas con el botón + Nueva Prueba" },
          { key: "admin-placement-3", en: "Edit questions in the Question Editor accordion", es: "Edita preguntas en el acordeón Editor de Preguntas" },
          { key: "admin-placement-4", en: "Set up recurring test schedules in the Scheduler tab", es: "Configura horarios recurrentes de pruebas en la pestaña Programador" },
          { key: "admin-placement-5", en: "Review all submissions and download PDF certificates", es: "Revisa todas las entregas y descarga certificados PDF" },
          { key: "admin-placement-6", en: "Add staff notes on any submission", es: "Agrega notas del personal en cualquier entrega" },
        ],
      },
      {
        id: "admin-outreach",
        en: { title: "4. Outreach Hub & Integrations", description: "Connect social media channels and manage API credentials." },
        es: { title: "4. Outreach Hub e Integraciones", description: "Conecta canales de redes sociales y gestiona credenciales de API." },
        icon: Zap,
        videoKey: "admin-outreach",
        items: [
          { key: "admin-outreach-1", en: "Go to Outreach Hub to connect Email, WhatsApp, Meta, Instagram, and other platforms", es: "Ve a Outreach Hub para conectar Correo, WhatsApp, Meta, Instagram y otras plataformas" },
          { key: "admin-outreach-2", en: "Click Connect on each platform and enter your API credentials", es: "Haz clic en Conectar en cada plataforma e ingresa tus credenciales de API" },
          { key: "admin-outreach-3", en: "Go to Meta Leads → Setup Guide to configure your Facebook webhook", es: "Ve a Meta Leads → Guía de Configuración para configurar tu webhook de Facebook" },
          { key: "admin-outreach-4", en: "Go to Integrations to manage webhooks and sync jobs", es: "Ve a Integraciones para gestionar webhooks y trabajos de sincronización" },
        ],
      },
      {
        id: "admin-onboarding-videos",
        en: { title: "5. Adding Tutorial Videos to This Guide", description: "Add YouTube tutorial videos to each section of this guide." },
        es: { title: "5. Agregar Videos Tutoriales a Esta Guía", description: "Agrega videos tutoriales de YouTube a cada sección de esta guía." },
        icon: Play,
        videoKey: "admin-onboarding-videos",
        items: [
          { key: "admin-videos-1", en: "Record a short screen-capture tutorial for each section (2–5 minutes recommended)", es: "Graba un tutorial corto de captura de pantalla para cada sección (2–5 minutos recomendado)" },
          { key: "admin-videos-2", en: "Upload the video to YouTube (unlisted is fine)", es: "Sube el video a YouTube (no listado está bien)" },
          { key: "admin-videos-3", en: "Click the Edit Video button on any section in this guide", es: "Haz clic en el botón Editar Video en cualquier sección de esta guía" },
          { key: "admin-videos-4", en: "Paste the YouTube URL and click Save — it embeds immediately", es: "Pega la URL de YouTube y haz clic en Guardar — se incrusta de inmediato" },
          { key: "admin-videos-5", en: "All staff can then watch the video directly in this guide", es: "Todo el personal podrá ver el video directamente en esta guía" },
        ],
      },
      {
        id: "admin-analytics",
        en: { title: "6. Analytics & Reporting", description: "Monitor CRM-wide performance metrics." },
        es: { title: "6. Analíticas e Informes", description: "Monitorea métricas de rendimiento de todo el CRM." },
        icon: BarChart3,
        videoKey: "admin-analytics",
        items: [
          { key: "admin-analytics-1", en: "Go to Analytics in the sidebar", es: "Ve a Analíticas en el menú lateral" },
          { key: "admin-analytics-2", en: "Review student growth, lead conversion, and revenue trends", es: "Revisa el crecimiento de estudiantes, conversión de prospectos y tendencias de ingresos" },
          { key: "admin-analytics-3", en: "Use the Financial Dashboard for detailed revenue/expense breakdown", es: "Usa el Panel Financiero para un desglose detallado de ingresos/gastos" },
          { key: "admin-analytics-4", en: "Export or screenshot reports for board meetings", es: "Exporta o captura informes para reuniones de directivos" },
        ],
      },
    ],
  },
];

// ─── YouTube embed helper ──────────────────────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
    else if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v");
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  section,
  completedItems,
  onToggle,
  videoUrl,
  isAdmin,
  onEditVideo,
  lang,
}: {
  section: Section;
  completedItems: Set<string>;
  onToggle: (key: string) => void;
  videoUrl?: string;
  isAdmin: boolean;
  onEditVideo: (sectionKey: string, currentUrl: string) => void;
  lang: "en" | "es";
}) {
  const [expanded, setExpanded] = useState(true);
  const done = section.items.filter((i) => completedItems.has(i.key)).length;
  const total = section.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;
  const content = section[lang];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <section.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight">{content.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{content.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={done === total ? "default" : "secondary"} className="text-xs">
              {done}/{total}
            </Badge>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        {total > 0 && (
          <Progress value={pct} className="h-1 mt-2" />
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            {section.items.map((item) => {
              const checked = completedItems.has(item.key);
              return (
                <div
                  key={item.key}
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => onToggle(item.key)}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggle(item.key)}
                    className="mt-0.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={`text-sm leading-snug ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item[lang]}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Play className="w-3 h-3" /> {lang === "en" ? "Tutorial Video" : "Video Tutorial"}
              </p>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={(e) => { e.stopPropagation(); onEditVideo(section.videoKey, videoUrl ?? ""); }}
                >
                  <Edit2 className="w-3 h-3" /> {lang === "en" ? "Edit Video" : "Editar Video"}
                </Button>
              )}
            </div>
            {embedUrl ? (
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={content.title}
                />
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Play className="w-8 h-8 opacity-30" />
                <p className="text-sm font-medium">{lang === "en" ? "Video coming soon" : "Video próximamente"}</p>
                {isAdmin && (
                  <p className="text-xs">{lang === "en" ? "Click Edit Video to add a YouTube link" : "Haz clic en Editar Video para agregar un enlace de YouTube"}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Role tab content ──────────────────────────────────────────────────────────
function RoleTab({
  role,
  videos,
  isAdmin,
  onEditVideo,
  lang,
}: {
  role: RoleDef;
  videos: Record<string, string>;
  isAdmin: boolean;
  onEditVideo: (sectionKey: string, currentUrl: string) => void;
  lang: "en" | "es";
}) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const progressQuery = trpc.guide.getProgress.useQuery({ role: role.id });

  if (!loaded && progressQuery.data) {
    setCompletedItems(new Set(progressQuery.data.completedItems));
    setLoaded(true);
  }

  const saveMutation = trpc.guide.saveProgress.useMutation();
  const resetMutation = trpc.guide.resetProgress.useMutation({
    onSuccess: () => {
      setCompletedItems(new Set());
      toast.success(lang === "en" ? "Progress reset" : "Progreso reiniciado");
    },
  });

  const handleToggle = useCallback((key: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const allKeys = role.sections.flatMap((s) => s.items.map((i) => i.key));
      const isNowComplete = allKeys.length > 0 && allKeys.every((k) => next.has(k));
      const itemsToSave = Array.from(next);
      if (isNowComplete) itemsToSave.push('__complete__');
      saveMutation.mutate({ role: role.id, completedItems: itemsToSave });
      if (isNowComplete) toast.success(lang === "en" ? '🎉 Onboarding complete! Your manager has been notified.' : '🎉 ¡Onboarding completo! Tu gerente ha sido notificado.');
      return next;
    });
  }, [role.id, role.sections, saveMutation, lang]);

  const allItems = role.sections.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const doneItems = allItems.filter((i) => completedItems.has(i.key)).length;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.color}`}>
                <role.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{role[lang]} {lang === "en" ? "Onboarding Progress" : "— Progreso de Onboarding"}</p>
                <p className="text-xs text-muted-foreground">{doneItems} {lang === "en" ? "of" : "de"} {totalItems} {lang === "en" ? "steps completed" : "pasos completados"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {overallPct === 100 && (
                <Badge className="bg-green-500 text-white gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {lang === "en" ? "Complete!" : "¡Completo!"}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => resetMutation.mutate({ role: role.id })}
                disabled={resetMutation.isPending || doneItems === 0}
              >
                <RefreshCw className="w-3 h-3" /> {lang === "en" ? "Reset" : "Reiniciar"}
              </Button>
            </div>
          </div>
          <Progress value={overallPct} className="h-3" />
          <p className="text-right text-xs text-muted-foreground mt-1">{overallPct}%</p>
        </CardContent>
      </Card>

      {progressQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {role.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              completedItems={completedItems}
              onToggle={handleToggle}
              videoUrl={videos[section.videoKey]}
              isAdmin={isAdmin}
              onEditVideo={onEditVideo}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnboardingGuide() {
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const lang = language as "en" | "es";
  const isAdmin = user?.role === "admin";

  const [editVideoKey, setEditVideoKey] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState("");

  const videosQuery = trpc.guide.listVideos.useQuery();
  const upsertVideoMutation = trpc.guide.upsertVideo.useMutation({
    onSuccess: () => {
      videosQuery.refetch();
      setEditVideoKey(null);
      toast.success(lang === "en" ? "Video URL saved" : "URL del video guardada");
    },
    onError: (e) => toast.error(e.message),
  });

  const videoMap: Record<string, string> = {};
  (videosQuery.data ?? []).forEach((v) => {
    if (v.youtubeUrl) videoMap[v.sectionKey] = v.youtubeUrl;
  });

  const handleEditVideo = (sectionKey: string, currentUrl: string) => {
    setEditVideoKey(sectionKey);
    setEditVideoUrl(currentUrl);
  };

  const handlePrint = () => window.print();

  const defaultTab = ROLES.find((r) => r.id === user?.role)?.id ?? ROLES[0].id;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {lang === "en" ? "Onboarding Guide" : "Guía de Onboarding"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lang === "en"
              ? "Role-specific instructions for using the LIOTA CRM. Check off each step as you complete it — your progress is saved automatically."
              : "Instrucciones específicas por rol para usar el CRM de LIOTA. Marca cada paso al completarlo — tu progreso se guarda automáticamente."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={toggleLanguage}
          >
            <Globe className="w-4 h-4" />
            {lang === "en" ? "ES" : "EN"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Download className="w-4 h-4" />
            {lang === "en" ? "Download PDF" : "Descargar PDF"}
          </Button>
        </div>
      </div>

      {/* Role tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {ROLES.map((role) => (
            <TabsTrigger key={role.id} value={role.id} className="gap-1.5 text-xs">
              <role.icon className="w-3.5 h-3.5" />
              {role[lang]}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map((role) => (
          <TabsContent key={role.id} value={role.id} className="mt-6">
            <RoleTab
              role={role}
              videos={videoMap}
              isAdmin={isAdmin}
              onEditVideo={handleEditVideo}
              lang={lang}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit video dialog */}
      <Dialog open={!!editVideoKey} onOpenChange={(o) => !o && setEditVideoKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "en" ? "Edit Tutorial Video" : "Editar Video Tutorial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>YouTube URL</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {lang === "en"
                  ? "Paste a YouTube video URL. It will be embedded in this section for all staff."
                  : "Pega una URL de YouTube. Se incrustará en esta sección para todo el personal."}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditVideoKey(null)}>
                {lang === "en" ? "Cancel" : "Cancelar"}
              </Button>
              <Button
                onClick={() => upsertVideoMutation.mutate({ sectionKey: editVideoKey!, youtubeUrl: editVideoUrl || null })}
                disabled={upsertVideoMutation.isPending}
              >
                {upsertVideoMutation.isPending
                  ? (lang === "en" ? "Saving..." : "Guardando...")
                  : (lang === "en" ? "Save Video" : "Guardar Video")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print styles */}
      <style>{`
        @media print {
          aside, nav, button, .no-print { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
