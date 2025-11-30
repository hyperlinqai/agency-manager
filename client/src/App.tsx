import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/client-detail";
import ClientOnboardingPage from "@/pages/client-onboarding";
import InvoicesPage from "@/pages/invoices";
import InvoiceCreatePage from "@/pages/invoice-create";
import InvoiceDetailPage from "@/pages/invoice-detail";
import VendorsPage from "@/pages/vendors";
import ExpensesPage from "@/pages/expenses";
import TeamSalariesPage from "@/pages/team-salaries";
import AttendancePage from "@/pages/attendance";
import LeaveManagementPage from "@/pages/leave-management";
import EmployeeOnboardingPage from "@/pages/employee-onboarding";
import SettingsPage from "@/pages/settings";
import ProposalsPage from "@/pages/proposals";
import ProposalCreatePage from "@/pages/proposal-create";
import ContractsPage from "@/pages/contracts";
import ContractCreatePage from "@/pages/contract-create";
import MonthlyReportsPage from "@/pages/monthly-reports";
import FinancialReportsPage from "@/pages/financial-reports";
import PublicOnboardingPage from "@/pages/public-onboarding";
import PublicTeamOnboardingPage from "@/pages/public-team-onboarding";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/clients">
        {() => (
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/clients/:id">
        {() => (
          <ProtectedRoute>
            <ClientDetailPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/client-onboarding">
        {() => (
          <ProtectedRoute>
            <ClientOnboardingPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/invoices">
        {() => (
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/invoices/new">
        {() => (
          <ProtectedRoute>
            <InvoiceCreatePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/invoices/:id">
        {() => (
          <ProtectedRoute>
            <InvoiceDetailPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/vendors">
        {() => (
          <ProtectedRoute>
            <VendorsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/expenses">
        {() => (
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/team-salaries">
        {() => (
          <ProtectedRoute>
            <TeamSalariesPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/attendance">
        {() => (
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/leave-management">
        {() => (
          <ProtectedRoute>
            <LeaveManagementPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/employee-onboarding">
        {() => (
          <ProtectedRoute>
            <EmployeeOnboardingPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/proposals">
        {() => (
          <ProtectedRoute>
            <ProposalsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/proposals/new">
        {() => (
          <ProtectedRoute>
            <ProposalCreatePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/proposals/:id">
        {() => (
          <ProtectedRoute>
            <ProposalCreatePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/contracts">
        {() => (
          <ProtectedRoute>
            <ContractsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/contracts/new">
        {() => (
          <ProtectedRoute>
            <ContractCreatePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/contracts/:id">
        {() => (
          <ProtectedRoute>
            <ContractCreatePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/monthly-reports">
        {() => (
          <ProtectedRoute>
            <MonthlyReportsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/monthly-reports/new">
        {() => (
          <ProtectedRoute>
            <MonthlyReportsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/monthly-reports/:id">
        {() => (
          <ProtectedRoute>
            <MonthlyReportsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/financial-reports">
        {() => (
          <ProtectedRoute>
            <FinancialReportsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16.5rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center h-14 px-4 bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
            <SidebarTrigger 
              data-testid="button-sidebar-toggle" 
              className="hover:bg-muted rounded-lg transition-colors"
            />
            <div className="ml-auto flex items-center gap-2">
              {/* Space for future header items */}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto scrollbar-thin animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/login">
              <LoginPage />
            </Route>
            <Route path="/onboarding/:token">
              {(params) => <PublicOnboardingPage token={params.token} />}
            </Route>
            <Route path="/team-onboarding/:token">
              {(params) => <PublicTeamOnboardingPage token={params.token} />}
            </Route>
            <Route path="*">
              {(params) => (
                <AppLayout>
                  <Router />
                </AppLayout>
              )}
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
