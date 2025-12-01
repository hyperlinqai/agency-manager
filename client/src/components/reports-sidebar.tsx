import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  BookOpen,
  Receipt,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  Clock,
  PieChart,
  FileText,
  Scale,
  Wallet,
  Landmark,
  Calculator,
  Package,
  FileSpreadsheet,
  ShoppingCart,
  Percent,
  BarChart3,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportItem {
  id: string;
  label: string;
  icon?: any;
}

interface ReportCategory {
  id: string;
  label: string;
  icon: any;
  items: ReportItem[];
}

const reportCategories: ReportCategory[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "comparison", label: "Period Comparison", icon: GitCompare },
    ],
  },
  {
    id: "financial",
    label: "Financial Reports",
    icon: DollarSign,
    items: [
      { id: "revenue-by-client", label: "Revenue by Client", icon: Users },
      { id: "profit-analysis", label: "Profit Analysis", icon: TrendingUp },
      { id: "profit-loss", label: "P&L Statement", icon: FileText },
      { id: "expenses", label: "Expense Tracking", icon: PieChart },
      { id: "invoice-aging", label: "Invoice Aging", icon: Clock },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: BookOpen,
    items: [
      { id: "balance-sheet", label: "Balance Sheet", icon: Scale },
      { id: "cash-flow", label: "Cash Flow", icon: Wallet },
      { id: "general-ledger", label: "General Ledger", icon: Landmark },
      { id: "trial-balance", label: "Trial Balance", icon: Calculator },
      { id: "fixed-assets", label: "Fixed Assets", icon: Package },
    ],
  },
  {
    id: "gst",
    label: "GST Compliance",
    icon: Receipt,
    items: [
      { id: "gstr3b-summary", label: "GSTR-3B Summary", icon: FileSpreadsheet },
      { id: "sales-register", label: "Sales Register", icon: FileText },
      { id: "purchase-register", label: "Purchase Register", icon: ShoppingCart },
      { id: "hsn-summary", label: "HSN/SAC Summary", icon: FileSpreadsheet },
      { id: "rate-summary", label: "Rate-wise Summary", icon: Percent },
    ],
  },
];

interface ReportsSidebarProps {
  activeReport: string;
  onReportSelect: (reportId: string) => void;
  collapsed?: boolean;
}

export function ReportsSidebar({ activeReport, onReportSelect, collapsed = false }: ReportsSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["overview", "financial"]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isExpanded = (categoryId: string) => expandedCategories.includes(categoryId);

  if (collapsed) {
    return (
      <div className="w-14 border-r bg-muted/30 flex flex-col items-center py-4 gap-2">
        {reportCategories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title={category.label}
            onClick={() => {
              const firstItem = category.items[0];
              if (firstItem) onReportSelect(firstItem.id);
            }}
          >
            <category.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Reports
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {reportCategories.map((category) => (
            <div key={category.id} className="mb-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  "text-muted-foreground"
                )}
              >
                <category.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{category.label}</span>
                {isExpanded(category.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Category Items */}
              {isExpanded(category.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeReport === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onReportSelect(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                          "transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {ItemIcon && <ItemIcon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export { reportCategories };
