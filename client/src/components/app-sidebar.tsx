import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  UserPlus,
  Wallet,
  FileSignature,
  BarChart3,
  Send,
  Building2,
  Receipt,
  UsersRound,
  CalendarCheck,
  CalendarOff,
  PieChart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Overview - Main dashboard
const overviewItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
];

// Client Management - Everything related to clients
const clientItems = [
  { title: "All Clients", url: "/clients", icon: Building2, testId: "link-clients" },
  { title: "Client Onboarding", url: "/client-onboarding", icon: UserPlus, testId: "link-client-onboarding" },
];

// Finance - Invoices, expenses, vendors
const financeItems = [
  { title: "Invoices", url: "/invoices", icon: FileText, testId: "link-invoices" },
  { title: "Expenses", url: "/expenses", icon: Receipt, testId: "link-expenses" },
  { title: "Vendors", url: "/vendors", icon: Briefcase, testId: "link-vendors" },
  { title: "Financial Reports", url: "/financial-reports", icon: PieChart, testId: "link-financial-reports" },
];

// HR & Payroll - Team members, salaries, attendance, leave
const hrPayrollItems = [
  { title: "Team Members", url: "/team-salaries", icon: UsersRound, testId: "link-team-members" },
  { title: "Salary Payments", url: "/team-salaries?tab=salaries", icon: Wallet, testId: "link-salaries" },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck, testId: "link-attendance" },
  { title: "Leave Management", url: "/leave-management", icon: CalendarOff, testId: "link-leave-management" },
  { title: "Employee Onboarding", url: "/employee-onboarding", icon: UserPlus, testId: "link-employee-onboarding" },
];

// Marketing - Proposals, contracts, reports
const marketingItems = [
  { title: "Proposals", url: "/proposals", icon: Send, testId: "link-proposals" },
  { title: "Contracts", url: "/contracts", icon: FileSignature, testId: "link-contracts" },
  { title: "Monthly Reports", url: "/monthly-reports", icon: BarChart3, testId: "link-monthly-reports" },
];

// System - Settings and User Management
const systemItems = [
  { title: "Settings", url: "/settings", icon: Settings, testId: "link-settings" },
  { title: "Users", url: "/users", icon: Users, testId: "link-users", roles: ["ADMIN", "MANAGER"] },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Track search params to re-render on query string changes
  const [searchParams, setSearchParams] = useState(() =>
    typeof window !== "undefined" ? window.location.search : ""
  );

  useEffect(() => {
    // Update search params when location changes
    setSearchParams(window.location.search);

    // Listen for popstate events (back/forward navigation)
    const handlePopState = () => {
      setSearchParams(window.location.search);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [location]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get current URL with query params
  const currentPath = typeof window !== "undefined" ? window.location.pathname : location;
  const currentSearch = searchParams;

  const isActive = (url: string) => {
    if (url === "/") return currentPath === url;

    // Check if URL has query params (e.g., /team-salaries?tab=salaries)
    const [urlPath, urlQuery] = url.split("?");

    // If the menu item has a query param, match both path and query
    if (urlQuery) {
      return currentPath === urlPath && currentSearch === `?${urlQuery}`;
    }

    // For items without query params, match path but ensure no query params in current URL
    // that would indicate a different tab
    if (currentPath === urlPath) {
      // If the current URL has no query params, this base item is active
      return !currentSearch;
    }

    // For non-tabbed pages, use startsWith
    return currentPath.startsWith(urlPath);
  };

  const renderMenuItems = (items: typeof overviewItems) => {
    // Filter items based on user role
    const filteredItems = items.filter((item: any) => {
      if (item.roles && user) {
        return item.roles.includes(user.role);
      }
      return true;
    });

    return (
      <SidebarMenu className="gap-0.5">
        {filteredItems.map((item: any) => {
          const active = isActive(item.url);
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={active}
                className={cn(
                  "group relative h-8 rounded-md transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                )}
              >
                <Link href={item.url} data-testid={item.testId}>
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      active ? "" : "group-hover:scale-110"
                    )}
                  />
                  <span className="font-medium text-[13px]">{item.title}</span>
                  {active && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    );
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-white">
              <img src="/logo.svg" alt="Agency Manager" className="h-7 w-7 object-contain" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">Agency Manager</span>
            <span className="text-[10px] text-sidebar-foreground/50">Hyperlinq Technology</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Overview */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            {renderMenuItems(overviewItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1.5" />

        {/* Clients */}
        <SidebarGroup className="py-0">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-2 text-sidebar-foreground/40 mb-0.5">
            Clients
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(clientItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance */}
        <SidebarGroup className="py-0 mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-2 text-sidebar-foreground/40 mb-0.5">
            Finance
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(financeItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* HR & Payroll */}
        <SidebarGroup className="py-0 mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-2 text-sidebar-foreground/40 mb-0.5">
            HR & Payroll
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(hrPayrollItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Marketing */}
        <SidebarGroup className="py-0 mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-2 text-sidebar-foreground/40 mb-0.5">
            Marketing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(marketingItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1.5" />

        {/* System */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            {renderMenuItems(systemItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-sidebar-accent/50">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white text-xs font-semibold">
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate">{user?.email || ""}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
