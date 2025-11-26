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
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="Hyperlinq Technology" 
            className="h-10 w-10 rounded-full object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Hyperlinq</span>
            <span className="text-xs text-muted-foreground">Technology</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide px-2">
            Active
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide px-2">
            Coming Soon
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {placeholderItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton disabled data-testid={item.testId}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 px-2"
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
