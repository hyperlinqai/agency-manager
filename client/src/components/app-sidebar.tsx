import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  CreditCard,
  DollarSign,
  Settings,
  BookOpen,
  Globe,
  LogOut,
  ChevronRight,
  ChevronDown,
  UserPlus,
  UserCheck,
  Wallet,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
  { title: "Clients", url: "/clients", icon: Users, testId: "link-clients" },
  { title: "Invoices", url: "/invoices", icon: FileText, testId: "link-invoices" },
  { title: "Vendors", url: "/vendors", icon: Briefcase, testId: "link-vendors" },
  { title: "Expenses", url: "/expenses", icon: CreditCard, testId: "link-expenses" },
];

const hrItems = [
  { title: "Team Members", url: "/team-salaries", icon: Users, testId: "link-team-members" },
  { title: "Salary Payments", url: "/team-salaries?tab=salaries", icon: Wallet, testId: "link-salaries" },
  { title: "Onboard Employee", url: "/employee-onboarding", icon: UserPlus, testId: "link-employee-onboarding" },
];

const onboardingItems = [
  { title: "Client Onboarding", url: "/client-onboarding", icon: UserCheck, testId: "link-client-onboarding" },
  { title: "Employee Onboarding", url: "/employee-onboarding", icon: UserPlus, testId: "link-employee-onboarding-2" },
];

const placeholderItems = [
  { title: "Learning Hub", url: "#", icon: BookOpen, testId: "link-learning-disabled" },
  { title: "Client Portal", url: "#", icon: Globe, testId: "link-portal-disabled" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [hrOpen, setHrOpen] = useState(
    location.includes("/team-salaries") || location.includes("/employee-onboarding")
  );
  const [onboardingOpen, setOnboardingOpen] = useState(
    location.includes("-onboarding")
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (url: string) => {
    if (url === "/") return location === url;
    return location.startsWith(url.split("?")[0]);
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-sidebar-foreground tracking-tight">HQ CRM</span>
            <span className="text-xs text-sidebar-foreground/60">Hyperlinq Technology</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 scrollbar-thin">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-3 text-sidebar-foreground/40 mb-1">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      className={cn(
                        "group relative h-10 rounded-lg transition-all duration-200",
                        active 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                          : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          active ? "" : "group-hover:scale-110"
                        )} />
                        <span className="font-medium">{item.title}</span>
                        {active && (
                          <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* HR & Payroll Section */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-3 text-sidebar-foreground/40 mb-1">
            HR & Payroll
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <Collapsible open={hrOpen} onOpenChange={setHrOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "group h-10 rounded-lg transition-all duration-200",
                        (location.includes("/team-salaries") || location.includes("/employee-onboarding"))
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                      )}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Team & Payroll</span>
                      <ChevronDown className={cn(
                        "ml-auto h-4 w-4 transition-transform duration-200",
                        hrOpen ? "rotate-180" : ""
                      )} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                      {hrItems.map((item) => {
                        const active = isActive(item.url);
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                              className={cn(
                                "h-9 rounded-md transition-all",
                                active
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                              )}
                            >
                              <Link href={item.url} data-testid={item.testId}>
                                <item.icon className="h-3.5 w-3.5" />
                                <span className="text-sm">{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Onboarding Section */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-3 text-sidebar-foreground/40 mb-1">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <Collapsible open={onboardingOpen} onOpenChange={setOnboardingOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "group h-10 rounded-lg transition-all duration-200",
                        location.includes("-onboarding")
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                      )}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="font-medium">Onboarding</span>
                      <ChevronDown className={cn(
                        "ml-auto h-4 w-4 transition-transform duration-200",
                        onboardingOpen ? "rotate-180" : ""
                      )} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                      {onboardingItems.map((item) => {
                        const active = isActive(item.url);
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                              className={cn(
                                "h-9 rounded-md transition-all",
                                active
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                              )}
                            >
                              <Link href={item.url} data-testid={item.testId}>
                                <item.icon className="h-3.5 w-3.5" />
                                <span className="text-sm">{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Settings - standalone */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/settings")}
                  className={cn(
                    "group relative h-10 rounded-lg transition-all duration-200",
                    isActive("/settings")
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <Link href="/settings" data-testid="link-settings">
                    <Settings className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive("/settings") ? "" : "group-hover:scale-110"
                    )} />
                    <span className="font-medium">Settings</span>
                    {isActive("/settings") && (
                      <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Coming Soon */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-3 text-sidebar-foreground/40 mb-1">
            Coming Soon
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {placeholderItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    disabled 
                    className="h-10 rounded-lg opacity-40 cursor-not-allowed"
                    data-testid={item.testId}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wide bg-sidebar-accent px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white text-xs font-semibold">
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || ""}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
