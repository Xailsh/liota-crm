import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import LiotaLayout from "./components/LiotaLayout";

function Router() {
  return (
    <LiotaLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/classes" component={Classes} />
        <Route path="/email-marketing" component={EmailMarketing} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/leads" component={LeadsPipeline} />
        <Route path="/academic-progress" component={AcademicProgress} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/financial" component={FinancialDashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </LiotaLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
