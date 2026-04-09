import React, { createContext, useContext, useState, useCallback } from "react";

type Language = "en" | "es";

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    students: "Students",
    classes: "Classes",
    emailMarketing: "Email Marketing",
    accounting: "Accounting",
    leads: "Leads Pipeline",
    academicProgress: "Academic Progress",
    contacts: "Contacts",
    analytics: "Analytics",
    financialDashboard: "Financial Dashboard",
    scholarships: "Scholarships",
    languagePackages: "Packages & Rates",
    camps: "Camps",
    specialEvents: "Special Events",
    whatsappTemplates: "WhatsApp Templates",
    voiceTemplates: "Voice Templates",
    emailTemplates: "Email Templates",
    metaLeads: "Meta Leads",
    setupGuide: "Setup Guide",
    webhookEvents: "Webhook Events",
    syncJobs: "Sync Jobs",
    errorLogs: "Error Logs",
    integrations: "Integrations",
    inboundWebhook: "Inbound Webhook",
    admin: "Admin",
    templates: "Templates",
    // Common actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    add: "Add",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    submit: "Submit",
    // Common labels
    name: "Name",
    email: "Email",
    phone: "Phone",
    status: "Status",
    date: "Date",
    notes: "Notes",
    actions: "Actions",
    type: "Type",
    amount: "Amount",
    description: "Description",
    campus: "Campus",
    program: "Program",
    level: "Level",
    language: "Language",
    category: "Category",
    // Dashboard
    welcomeBack: "Welcome back",
    totalStudents: "Total Students",
    monthlyRevenue: "Monthly Revenue",
    activeCampaigns: "Active Campaigns",
    scheduledClasses: "Scheduled Classes",
    satisfactionRate: "Satisfaction Rate",
    activeLeads: "Active Leads",
    recentActivity: "Recent Activity",
    quickActions: "Quick Actions",
    // Students
    newStudent: "New Student",
    studentProfile: "Student Profile",
    enrollmentStatus: "Enrollment Status",
    ageGroup: "Age Group",
    cefrLevel: "CEFR Level",
    // Financial
    enterPin: "Enter PIN",
    pinProtected: "PIN Protected",
    financialData: "Financial Data",
    estimatedRevenue: "Estimated Revenue",
    collectedRevenue: "Collected Revenue",
    pendingRevenue: "Pending Revenue",
    totalExpenses: "Total Expenses",
    netProfit: "Net Profit",
    // Payments
    paymentMethod: "Payment Method",
    stripe: "Stripe",
    zelle: "Zelle",
    paypal: "PayPal",
    cash: "Cash",
    bankTransfer: "Bank Transfer",
    dollaApp: "Dolla App",
    // Campuses
    merida: "Mérida",
    dallas: "Dallas",
    denver: "Denver",
    vienna: "Vienna",
    nottingham: "Nottingham",
    online: "Online",
    all: "All",
    // Status
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    draft: "Draft",
    approved: "Approved",
    rejected: "Rejected",
    // Messages
    noData: "No data available",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    saved: "Saved successfully",
    deleted: "Deleted successfully",
    updated: "Updated successfully",
    created: "Created successfully",
  },
  es: {
    // Navigation
    dashboard: "Panel Principal",
    students: "Estudiantes",
    classes: "Clases",
    emailMarketing: "Email Marketing",
    accounting: "Contabilidad",
    leads: "Pipeline de Leads",
    academicProgress: "Progreso Académico",
    contacts: "Contactos",
    analytics: "Analíticas",
    financialDashboard: "Dashboard Financiero",
    scholarships: "Becas",
    languagePackages: "Paquetes y Tarifas",
    camps: "Campamentos",
    specialEvents: "Eventos Especiales",
    whatsappTemplates: "Plantillas WhatsApp",
    voiceTemplates: "Plantillas de Voz",
    emailTemplates: "Plantillas de Email",
    metaLeads: "Meta Leads",
    setupGuide: "Guía de Configuración",
    webhookEvents: "Eventos Webhook",
    syncJobs: "Sincronización",
    errorLogs: "Registro de Errores",
    integrations: "Integraciones",
    inboundWebhook: "Webhook Entrante",
    admin: "Administración",
    templates: "Plantillas",
    // Common actions
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    add: "Agregar",
    search: "Buscar",
    filter: "Filtrar",
    export: "Exportar",
    import: "Importar",
    close: "Cerrar",
    confirm: "Confirmar",
    back: "Atrás",
    next: "Siguiente",
    submit: "Enviar",
    // Common labels
    name: "Nombre",
    email: "Correo Electrónico",
    phone: "Teléfono",
    status: "Estado",
    date: "Fecha",
    notes: "Notas",
    actions: "Acciones",
    type: "Tipo",
    amount: "Monto",
    description: "Descripción",
    campus: "Sede",
    program: "Programa",
    level: "Nivel",
    language: "Idioma",
    category: "Categoría",
    // Dashboard
    welcomeBack: "Bienvenido de nuevo",
    totalStudents: "Total Estudiantes",
    monthlyRevenue: "Ingresos del Mes",
    activeCampaigns: "Campañas Activas",
    scheduledClasses: "Clases Programadas",
    satisfactionRate: "Tasa de Satisfacción",
    activeLeads: "Leads Activos",
    recentActivity: "Actividad Reciente",
    quickActions: "Acciones Rápidas",
    // Students
    newStudent: "Nuevo Estudiante",
    studentProfile: "Perfil del Estudiante",
    enrollmentStatus: "Estado de Matrícula",
    ageGroup: "Grupo de Edad",
    cefrLevel: "Nivel MCER",
    // Financial
    enterPin: "Ingresar PIN",
    pinProtected: "Protegido con PIN",
    financialData: "Datos Financieros",
    estimatedRevenue: "Ingresos Estimados",
    collectedRevenue: "Ingresos Cobrados",
    pendingRevenue: "Por Cobrar",
    totalExpenses: "Gastos Totales",
    netProfit: "Ganancia Neta",
    // Payments
    paymentMethod: "Método de Pago",
    stripe: "Stripe",
    zelle: "Zelle",
    paypal: "PayPal",
    cash: "Efectivo",
    bankTransfer: "Transferencia Bancaria",
    dollaApp: "Dolla App",
    // Campuses
    merida: "Mérida",
    dallas: "Dallas",
    denver: "Denver",
    vienna: "Viena",
    nottingham: "Nottingham",
    online: "En Línea",
    all: "Todos",
    // Status
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    completed: "Completado",
    cancelled: "Cancelado",
    draft: "Borrador",
    approved: "Aprobado",
    rejected: "Rechazado",
    // Messages
    noData: "Sin datos disponibles",
    loading: "Cargando...",
    error: "Ocurrió un error",
    success: "Éxito",
    saved: "Guardado exitosamente",
    deleted: "Eliminado exitosamente",
    updated: "Actualizado exitosamente",
    created: "Creado exitosamente",
  },
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("liota_language") as Language) ?? "en";
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("liota_language", lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    handleSetLanguage(language === "en" ? "es" : "en");
  }, [language, handleSetLanguage]);

  const t = useCallback((key: TranslationKey): string => {
    const langTranslations = translations[language] as Record<string, string>;
    return langTranslations[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export type { Language, TranslationKey };
