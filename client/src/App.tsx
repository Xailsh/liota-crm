import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import EmailMarketing from "./pages/EmailMarketing";
import Accounting from "./pages/Accounting";
import LeadsPipeline from "./pages/LeadsPipeline";
import AcademicProgress from "./pages/AcademicProgress";
import Contacts from "./pages/Contacts";
import Analytics from "./pages/Analytics";
import FinancialDashboard from "./pages/FinancialDashboard";
import Scholarships from "./pages/Scholarships";
import LanguagePackages from "./pages/LanguagePackages";
import Camps from "./pages/Camps";
import SpecialEvents from "./pages/SpecialEvents";
import WhatsAppTemplates from "./pages/WhatsAppTemplates";
import VoiceTemplates from "./pages/VoiceTemplates";
import EmailTemplates from "./pages/EmailTemplates";
import MetaLeads from "./pages/MetaLeads";
import Integrations from "./pages/Integrations";
import AdminPanel from "./pages/AdminPanel";
import BulkEmail from "./pages/BulkEmail";
import DripCampaigns from "./pages/DripCampaigns";
import BookCatalog from "./pages/BookCatalog";
import StudyAbroad from "./pages/StudyAbroad";
import LiotaLayout from "./components/LiotaLayout";

function Router() {
  return (
    <LiotaLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/classes" component={Classes} />
        <Route path="/email-marketing" component={EmailMarketing} />
        <Route path="/email-templates" component={EmailTemplates} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/leads" component={LeadsPipeline} />
        <Route path="/academic-progress" component={AcademicProgress} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/financial" component={FinancialDashboard} />
        <Route path="/scholarships" component={Scholarships} />
        <Route path="/packages" component={LanguagePackages} />
        <Route path="/camps" component={Camps} />
        <Route path="/events" component={SpecialEvents} />
        <Route path="/whatsapp-templates" component={WhatsAppTemplates} />
        <Route path="/voice-templates" component={VoiceTemplates} />
        <Route path="/meta-leads" component={MetaLeads} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/bulk-email" component={BulkEmail} />
        <Route path="/drip-campaigns" component={DripCampaigns} />
        <Route path="/book-catalog" component={BookCatalog} />
        <Route path="/study-abroad" component={StudyAbroad} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </LiotaLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
