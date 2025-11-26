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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const activeItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
  { title: "Clients", url: "/clients", icon: Users, testId: "link-clients" },
  { title: "Invoices", url: "/invoices", icon: FileText, testId: "link-invoices" },
  { title: "Vendors", url: "/vendors", icon: Briefcase, testId: "link-vendors" },
  { title: "Expenses", url: "/expenses", icon: CreditCard, testId: "link-expenses" },
  { title: "Team & Salaries", url: "/team-salaries", icon: DollarSign, testId: "link-team-salaries" },
  { title: "Settings", url: "/settings", icon: Settings, testId: "link-settings" },
];

const placeholderItems = [
  { title: "Learning Hub", url: "#", icon: BookOpen, testId: "link-learning-disabled" },
  { title: "Client Portal", url: "#", icon: Globe, testId: "link-portal-disabled" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-3 text-sidebar-foreground/40 mb-1">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {activeItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "group relative h-10 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                          : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isActive ? "" : "group-hover:scale-110"
                        )} />
                        <span className="font-medium">{item.title}</span>
                        {isActive && (
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
