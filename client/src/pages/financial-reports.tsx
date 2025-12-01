import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ReportsSidebar } from "@/components/reports-sidebar";
import { ComparisonGroup } from "@/components/comparison-badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Receipt,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  BookOpen,
  Scale,
  Package,
  CheckCircle,
  XCircle,
  IndianRupee,
  ShoppingCart,
  Percent,
  FileSpreadsheet,
  Download,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Client, Invoice, Expense, Payment } from "@shared/schema";

// Types for report data
interface RevenueByClient {
  clientId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
}

interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  invoices: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }[];
}

interface ExpenseByCategory {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

interface ProfitByClient {
  clientId: string;
  clientName: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

interface PLStatement {
  period: string;
  revenue: {
    invoiced: number;
    collected: number;
  };
  expenses: {
    operational: number;
    salaries: number;
    vendors: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  margin: number;
}

interface BalanceSheetData {
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      pendingSalaries: number;
      total: number;
    };
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
}

interface CashFlowData {
  period: string;
  inflows: {
    collections: number;
    total: number;
  };
  outflows: {
    expenses: number;
    salaries: number;
    vendors: number;
    total: number;
  };
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

interface GeneralLedgerEntry {
  date: string;
  voucherNo: string;
  particulars: string;
  accountHead: string;
  debit: number;
  credit: number;
  balance: number;
  type: string;
}

interface TrialBalanceData {
  accounts: {
    accountName: string;
    accountType: string;
    debit: number;
    credit: number;
  }[];
  totals: {
    debit: number;
    credit: number;
    isBalanced: boolean;
  };
}

interface FixedAssetRegisterData {
  assets: {
    id: string;
    name: string;
    description: string;
    category: string;
    purchaseDate: string;
    purchaseValue: number;
    depreciationMethod: string;
    depreciationRate: number;
    usefulLifeYears: number;
    salvageValue: number;
    accumulatedDepreciation: number;
    currentValue: number;
    yearsOwned: number;
    location: string;
    status: string;
    vendor: string | null;
    invoiceNumber: string | null;
  }[];
  summary: {
    totalAssets: number;
    activeAssets: number;
    totalPurchaseValue: number;
    totalCurrentValue: number;
    totalDepreciation: number;
    categoryWise: {
      category: string;
      count: number;
      purchaseValue: number;
      currentValue: number;
      depreciation: number;
    }[];
  };
}

// GST Report Types
interface GstSalesEntry {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  gstin: string;
  placeOfSupply: string;
  invoiceType: "B2B" | "B2C";
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  invoiceValue: number;
  status: string;
}

interface GstSalesRegister {
  entries: GstSalesEntry[];
  summary: {
    totalInvoices: number;
    b2bInvoices: number;
    b2cInvoices: number;
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGst: number;
    totalInvoiceValue: number;
  };
}

interface GstPurchaseEntry {
  voucherNumber: string;
  voucherDate: string;
  vendorName: string;
  gstin: string;
  description: string;
  category: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalValue: number;
  itcEligible: boolean;
  status: string;
}

interface GstPurchaseRegister {
  entries: GstPurchaseEntry[];
  summary: {
    totalEntries: number;
    eligibleForItc: number;
    notEligibleForItc: number;
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGst: number;
    eligibleItc: number;
    totalPurchaseValue: number;
  };
}

interface Gstr3bSummary {
  outwardSupplies: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  inputTaxCredit: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalItc: number;
  };
  itcUtilization: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  netTaxPayable: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
}

interface HsnSummary {
  entries: {
    hsnCode: string;
    description: string;
    quantity: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  }[];
  totals: {
    totalQuantity: number;
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
  };
}

interface GstRateSummary {
  rate: number;
  invoiceCount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  invoiceValue: number;
}

// Comparison types for MoM/YoY/QoQ metrics
interface ComparisonMetric {
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface ComparisonData {
  current: {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
  mom: { label: string; revenue: ComparisonMetric; expenses: ComparisonMetric; profit: ComparisonMetric };
  yoy: { label: string; revenue: ComparisonMetric; expenses: ComparisonMetric; profit: ComparisonMetric };
  qoq: { label: string; revenue: ComparisonMetric; expenses: ComparisonMetric; profit: ComparisonMetric };
}

interface TrendData {
  month: string;
  monthKey: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

// Period options for reports
const periodOptions = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "last-quarter", label: "Last Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "all-time", label: "All Time" },
];

export default function FinancialReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("this-month");
  const [activeTab, setActiveTab] = useState("revenue-by-client");
  const [activeReport, setActiveReport] = useState("revenue-by-client");
  const { user } = useAuth();
  const { toast } = useToast();

  // Export endpoint mapping
  const exportEndpointMap: Record<string, string> = {
    'revenue-by-client': '/api/reports/revenue-by-client/export',
    'invoice-aging': '/api/reports/invoice-aging/export',
    'expense-tracking': '/api/reports/expenses-by-category/export',
    'profit-by-client': '/api/reports/profit-by-client/export',
    'profit-loss': '/api/reports/profit-loss/export',
    'balance-sheet': '/api/reports/balance-sheet/export',
    'cash-flow': '/api/reports/cash-flow/export',
    'general-ledger': '/api/reports/general-ledger/export',
    'trial-balance': '/api/reports/trial-balance/export',
    'fixed-assets': '/api/reports/fixed-asset-register/export',
    'gst-summary': '/api/reports/gst/gstr3b-summary/export',
    'gst-sales': '/api/reports/gst/sales-register/export',
    'gst-purchase': '/api/reports/gst/purchase-register/export',
    'gst-hsn': '/api/reports/gst/hsn-summary/export',
    'gst-rate': '/api/reports/gst/rate-summary/export',
  };

  // Handle report download
  const handleDownload = async (format: 'pdf' | 'excel') => {
    const endpoint = exportEndpointMap[activeTab];
    if (!endpoint) {
      toast({
        title: "Export not available",
        description: "This report type does not support export yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = `${endpoint}/${format}?period=${selectedPeriod}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `report-${activeTab}-${selectedPeriod}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Your ${format.toUpperCase()} report is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Map sidebar selection to tab values
  const sidebarToTabMap: Record<string, string> = {
    'dashboard': 'revenue-by-client',
    'revenue-by-client': 'revenue-by-client',
    'invoice-aging': 'invoice-aging',
    'expenses': 'expense-tracking',
    'profit-analysis': 'profit-by-client',
    'profit-loss': 'profit-loss',
    'balance-sheet': 'balance-sheet',
    'cash-flow': 'cash-flow',
    'general-ledger': 'general-ledger',
    'trial-balance': 'trial-balance',
    'fixed-assets': 'fixed-assets',
    'gstr3b-summary': 'gst-summary',
    'sales-register': 'gst-sales',
    'purchase-register': 'gst-purchase',
    'hsn-summary': 'gst-hsn',
    'rate-summary': 'gst-rate',
  };

  // Sync sidebar to tabs
  useEffect(() => {
    const tabValue = sidebarToTabMap[activeReport];
    if (tabValue && tabValue !== activeTab) {
      setActiveTab(tabValue);
    }
  }, [activeReport]);

  // Fetch report data
  const { data: revenueByClient, isLoading: revenueLoading } = useQuery<RevenueByClient[]>({
    queryKey: ["/api/reports/revenue-by-client", selectedPeriod],
  });

  const { data: agingData, isLoading: agingLoading } = useQuery<AgingBucket[]>({
    queryKey: ["/api/reports/invoice-aging"],
  });

  const { data: expensesByCategory, isLoading: expensesLoading } = useQuery<ExpenseByCategory[]>({
    queryKey: ["/api/reports/expenses-by-category", selectedPeriod],
  });

  const { data: profitByClient, isLoading: profitLoading } = useQuery<ProfitByClient[]>({
    queryKey: ["/api/reports/profit-by-client", selectedPeriod],
  });

  const { data: plStatement, isLoading: plLoading } = useQuery<PLStatement>({
    queryKey: ["/api/reports/profit-loss", selectedPeriod],
  });

  const { data: balanceSheet, isLoading: balanceLoading } = useQuery<BalanceSheetData>({
    queryKey: ["/api/reports/balance-sheet"],
  });

  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery<CashFlowData[]>({
    queryKey: ["/api/reports/cash-flow", selectedPeriod],
  });

  const { data: generalLedger, isLoading: ledgerLoading } = useQuery<GeneralLedgerEntry[]>({
    queryKey: ["/api/reports/general-ledger", selectedPeriod],
  });

  const { data: trialBalance, isLoading: trialBalanceLoading } = useQuery<TrialBalanceData>({
    queryKey: ["/api/reports/trial-balance"],
  });

  const { data: fixedAssetRegister, isLoading: assetRegisterLoading } = useQuery<FixedAssetRegisterData>({
    queryKey: ["/api/reports/fixed-asset-register"],
  });

  // GST Report Queries
  const { data: gstSalesRegister, isLoading: gstSalesLoading } = useQuery<GstSalesRegister>({
    queryKey: ["/api/reports/gst/sales-register", selectedPeriod],
  });

  const { data: gstPurchaseRegister, isLoading: gstPurchaseLoading } = useQuery<GstPurchaseRegister>({
    queryKey: ["/api/reports/gst/purchase-register", selectedPeriod],
  });

  const { data: gstr3bSummary, isLoading: gstr3bLoading } = useQuery<Gstr3bSummary>({
    queryKey: ["/api/reports/gst/gstr3b-summary", selectedPeriod],
  });

  const { data: hsnSummary, isLoading: hsnLoading } = useQuery<HsnSummary>({
    queryKey: ["/api/reports/gst/hsn-summary"],
  });

  const { data: gstRateSummary, isLoading: gstRateLoading } = useQuery<GstRateSummary[]>({
    queryKey: ["/api/reports/gst/rate-summary"],
  });

  // Comparison and Trend Queries
  const { data: comparisonData } = useQuery<ComparisonData>({
    queryKey: ["/api/reports/comparison", { period: selectedPeriod }],
  });

  const { data: trendData } = useQuery<TrendData[]>({
    queryKey: ["/api/reports/trends"],
  });

  // Summary card component with comparison support
  const SummaryCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color = "primary",
    comparison,
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    color?: "primary" | "green" | "red" | "amber" | "blue";
    comparison?: {
      mom?: { change: number; trend: 'up' | 'down' | 'neutral' };
      yoy?: { change: number; trend: 'up' | 'down' | 'neutral' };
      qoq?: { change: number; trend: 'up' | 'down' | 'neutral' };
    };
  }) => {
    const colorClasses = {
      primary: "bg-primary/10 text-primary",
      green: "bg-green-100 dark:bg-green-950 text-green-600",
      red: "bg-red-100 dark:bg-red-950 text-red-600",
      amber: "bg-amber-100 dark:bg-amber-950 text-amber-600",
      blue: "bg-blue-100 dark:bg-blue-950 text-blue-600",
    };

    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", colorClasses[color])}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium mt-2",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
          {comparison && (
            <ComparisonGroup
              mom={comparison.mom}
              yoy={comparison.yoy}
              qoq={comparison.qoq}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <ReportsSidebar
        activeReport={activeReport}
        onReportSelect={setActiveReport}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Financial Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive financial analysis and reporting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Download Dropdown */}
            {activeReport !== "comparison" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload('pdf')} className="gap-2">
                    <FileDown className="h-4 w-4 text-red-500" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('excel')} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Download Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Comparison View */}
        {activeReport === "comparison" && (
          <div className="space-y-6">
            {/* Comparison Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard
                title="Revenue"
                value={formatCurrency(comparisonData?.current.revenue || 0)}
                icon={DollarSign}
                color="green"
                comparison={comparisonData ? {
                  mom: { change: comparisonData.mom.revenue.change, trend: comparisonData.mom.revenue.trend },
                  yoy: { change: comparisonData.yoy.revenue.change, trend: comparisonData.yoy.revenue.trend },
                  qoq: { change: comparisonData.qoq.revenue.change, trend: comparisonData.qoq.revenue.trend },
                } : undefined}
              />
              <SummaryCard
                title="Expenses"
                value={formatCurrency(comparisonData?.current.expenses || 0)}
                icon={Receipt}
                color="red"
                comparison={comparisonData ? {
                  mom: { change: comparisonData.mom.expenses.change, trend: comparisonData.mom.expenses.trend },
                  yoy: { change: comparisonData.yoy.expenses.change, trend: comparisonData.yoy.expenses.trend },
                  qoq: { change: comparisonData.qoq.expenses.change, trend: comparisonData.qoq.expenses.trend },
                } : undefined}
              />
              <SummaryCard
                title="Net Profit"
                value={formatCurrency(comparisonData?.current.profit || 0)}
                icon={TrendingUp}
                color="blue"
                comparison={comparisonData ? {
                  mom: { change: comparisonData.mom.profit.change, trend: comparisonData.mom.profit.trend },
                  yoy: { change: comparisonData.yoy.profit.change, trend: comparisonData.yoy.profit.trend },
                  qoq: { change: comparisonData.qoq.profit.change, trend: comparisonData.qoq.profit.trend },
                } : undefined}
              />
              <SummaryCard
                title="Profit Margin"
                value={`${comparisonData?.current.margin?.toFixed(1) || 0}%`}
                icon={Percent}
                color="amber"
              />
            </div>

            {/* Trend Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">12-Month Trend</CardTitle>
                <CardDescription>Revenue, expenses, and profit over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="profit" name="Profit" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Period Comparison Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Period Comparison</CardTitle>
                <CardDescription>Compare metrics across different time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">MoM</TableHead>
                      <TableHead className="text-right">YoY</TableHead>
                      <TableHead className="text-right">QoQ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Revenue</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(comparisonData?.current.revenue || 0)}</TableCell>
                      <TableCell className={cn("text-right font-mono", comparisonData?.mom.revenue.trend === 'up' ? "text-green-600" : comparisonData?.mom.revenue.trend === 'down' ? "text-red-600" : "")}>
                        {(comparisonData?.mom.revenue.change || 0) > 0 ? '+' : ''}{(comparisonData?.mom.revenue.change || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-mono", comparisonData?.yoy.revenue.trend === 'up' ? "text-green-600" : comparisonData?.yoy.revenue.trend === 'down' ? "text-red-600" : "")}>
                        {(comparisonData?.yoy.revenue.change || 0) > 0 ? '+' : ''}{(comparisonData?.yoy.revenue.change || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-mono", comparisonData?.qoq.revenue.trend === 'up' ? "text-green-600" : comparisonData?.qoq.revenue.trend === 'down' ? "text-red-600" : "")}>
                        {(comparisonData?.qoq.revenue.change || 0) > 0 ? '+' : ''}{(comparisonData?.qoq.revenue.change || 0).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Expenses</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(comparisonData?.current.expenses || 0)}</TableCell>
                      <TableCell className={cn("text-right font-mono", comparisonData?.mom.expenses.trend === 'down' ? "text-green-600" : comparisonData?.mom.expenses.trend === 'up' ? "text-red-600" : "")}>
                        {(comparisonData?.mom.expenses.change || 0) > 0 ? '+' : ''}{(comparisonData?.mom.expenses.change || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-mono", comparisonData?.yoy.expenses.trend === 'down' ? "text-green-600" : comparisonData?.yoy.expenses.trend === 'up' ? "text-red-600" : "")}>
                        {(comparisonData?.yoy.expenses.change || 0) > 0 ? '+' : ''}{(comparisonData?.yoy.expenses.change || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-mono", comparisonData?.qoq.expenses.trend === 'down' ? "text-green-600" : comparisonData?.qoq.expenses.trend === 'up' ? "text-red-600" : "")}>
                        {(comparisonData?.qoq.expenses.change || 0) > 0 ? '+' : ''}{(comparisonData?.qoq.expenses.change || 0).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Net Profit</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(comparisonData?.current.profit || 0)}</TableCell>
                      <TableCell className={cn("text-right font-mono font-semibold", comparisonData?.mom.profit.trend === 'up' ? "text-green-600" : comparisonData?.mom.profit.trend === 'down' ? "text-red-600" : "")}>
                        {(comparisonData?.mom.profit.change || 0) > 0 ? '+' : ''}{(comparisonData?.mom.profit.change || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-mono font-semibold", comparisonData?.yoy.profit.trend === 'up' ? "text-green-600" : comparisonData?.yoy.profit.trend === 'down' ? "text-red-600" : "")}>
                        {(comparisonData?.yoy.profit.change || 0) > 0 ? '+' : ''}{(comparisonData?.yoy.profit.change || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-mono font-semibold", comparisonData?.qoq.profit.trend === 'up' ? "text-green-600" : comparisonData?.qoq.profit.trend === 'down' ? "text-red-600" : "")}>
                        {(comparisonData?.qoq.profit.change || 0) > 0 ? '+' : ''}{(comparisonData?.qoq.profit.change || 0).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports content - controlled by sidebar navigation */}
        {activeReport !== "comparison" && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Revenue by Client Tab */}
        <TabsContent value="revenue-by-client" className="space-y-6">
          {revenueLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Total Revenue"
                  value={formatCurrency(revenueByClient?.reduce((sum, c) => sum + c.totalInvoiced, 0) || 0)}
                  icon={DollarSign}
                  color="green"
                />
                <SummaryCard
                  title="Total Collected"
                  value={formatCurrency(revenueByClient?.reduce((sum, c) => sum + c.totalPaid, 0) || 0)}
                  icon={TrendingUp}
                  color="blue"
                />
                <SummaryCard
                  title="Outstanding"
                  value={formatCurrency(revenueByClient?.reduce((sum, c) => sum + c.totalOutstanding, 0) || 0)}
                  icon={Clock}
                  color="amber"
                />
                <SummaryCard
                  title="Active Clients"
                  value={revenueByClient?.length?.toString() || "0"}
                  icon={Users}
                  color="primary"
                />
              </div>

              {/* Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Distribution by Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByClient?.slice(0, 10) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis dataKey="clientName" type="category" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="totalPaid" name="Collected" fill="#10b981" />
                        <Bar dataKey="totalOutstanding" name="Outstanding" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Client Revenue Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                        <TableHead className="text-right">Total Invoiced</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">Collection Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueByClient?.map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">{client.clientName}</TableCell>
                          <TableCell className="text-right">{client.invoiceCount}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(client.totalInvoiced)}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{formatCurrency(client.totalPaid)}</TableCell>
                          <TableCell className="text-right font-mono text-amber-600">{formatCurrency(client.totalOutstanding)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={client.totalInvoiced > 0 && (client.totalPaid / client.totalInvoiced) >= 0.8 ? "default" : "secondary"}>
                              {client.totalInvoiced > 0 ? `${((client.totalPaid / client.totalInvoiced) * 100).toFixed(1)}%` : "0%"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Invoice Aging Tab */}
        <TabsContent value="invoice-aging" className="space-y-6">
          {agingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              {/* Aging Buckets */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {agingData?.map((bucket, index) => (
                  <Card key={bucket.range} className={cn(
                    "border-0 shadow-sm",
                    index === 0 && "bg-green-50 dark:bg-green-950/30",
                    index === 1 && "bg-amber-50 dark:bg-amber-950/30",
                    index === 2 && "bg-orange-50 dark:bg-orange-950/30",
                    index >= 3 && "bg-red-50 dark:bg-red-950/30"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{bucket.range}</span>
                        <Badge variant={index >= 2 ? "destructive" : index === 1 ? "secondary" : "default"}>
                          {bucket.count} invoices
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold font-mono">
                        {formatCurrency(bucket.amount)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Aging Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Aging Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={agingData || []}
                          dataKey="amount"
                          nameKey="range"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {agingData?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Overdue Invoices Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Overdue Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Days Overdue</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agingData?.flatMap((bucket) =>
                        bucket.invoices.filter((inv) => inv.daysOverdue > 0)
                      ).slice(0, 20).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.clientName}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={invoice.daysOverdue > 60 ? "destructive" : invoice.daysOverdue > 30 ? "secondary" : "outline"}>
                              {invoice.daysOverdue} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">Overdue</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Expense Tracking Tab */}
        <TabsContent value="expense-tracking" className="space-y-6">
          {expensesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Total Expenses"
                  value={formatCurrency(expensesByCategory?.reduce((sum, c) => sum + c.totalAmount, 0) || 0)}
                  icon={Receipt}
                  color="red"
                />
                <SummaryCard
                  title="Categories"
                  value={expensesByCategory?.length?.toString() || "0"}
                  icon={FileText}
                  color="blue"
                />
                <SummaryCard
                  title="Transactions"
                  value={expensesByCategory?.reduce((sum, c) => sum + c.count, 0)?.toString() || "0"}
                  icon={DollarSign}
                  color="primary"
                />
                <SummaryCard
                  title="Avg per Transaction"
                  value={formatCurrency(
                    expensesByCategory && expensesByCategory.length > 0
                      ? expensesByCategory.reduce((sum, c) => sum + c.totalAmount, 0) /
                        expensesByCategory.reduce((sum, c) => sum + c.count, 0)
                      : 0
                  )}
                  icon={TrendingDown}
                  color="amber"
                />
              </div>

              {/* Expense by Category Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesByCategory || []}
                            dataKey="totalAmount"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ categoryName, percentage }) => `${categoryName}: ${percentage.toFixed(1)}%`}
                          >
                            {expensesByCategory?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={expensesByCategory || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                          <YAxis dataKey="categoryName" type="category" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="totalAmount" name="Amount" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Expense Categories Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                        <TableHead className="text-right">Avg per Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expensesByCategory?.map((category) => (
                        <TableRow key={category.categoryId}>
                          <TableCell className="font-medium">{category.categoryName}</TableCell>
                          <TableCell className="text-right">{category.count}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(category.totalAmount)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(category.count > 0 ? category.totalAmount / category.count : 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Profit by Client Tab */}
        <TabsContent value="profit-by-client" className="space-y-6">
          {profitLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Total Revenue"
                  value={formatCurrency(profitByClient?.reduce((sum, c) => sum + c.revenue, 0) || 0)}
                  icon={TrendingUp}
                  color="green"
                />
                <SummaryCard
                  title="Total Expenses"
                  value={formatCurrency(profitByClient?.reduce((sum, c) => sum + c.expenses, 0) || 0)}
                  icon={TrendingDown}
                  color="red"
                />
                <SummaryCard
                  title="Total Profit"
                  value={formatCurrency(profitByClient?.reduce((sum, c) => sum + c.profit, 0) || 0)}
                  icon={DollarSign}
                  color="blue"
                />
                <SummaryCard
                  title="Avg Margin"
                  value={`${(
                    profitByClient && profitByClient.length > 0
                      ? profitByClient.reduce((sum, c) => sum + c.margin, 0) / profitByClient.length
                      : 0
                  ).toFixed(1)}%`}
                  icon={BarChart3}
                  color="primary"
                />
              </div>

              {/* Profit Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Profit by Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitByClient?.slice(0, 10) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="clientName" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                        <Bar dataKey="profit" name="Profit" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Profit Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Client Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitByClient?.map((client) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">{client.clientName}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{formatCurrency(client.revenue)}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{formatCurrency(client.expenses)}</TableCell>
                          <TableCell className={cn("text-right font-mono font-semibold", client.profit >= 0 ? "text-blue-600" : "text-red-600")}>
                            {formatCurrency(client.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={client.margin >= 30 ? "default" : client.margin >= 0 ? "secondary" : "destructive"}>
                              {client.margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.profit >= 0 ? "default" : "destructive"}>
                              {client.profit >= 0 ? "Profitable" : "Loss"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* P&L Statement Tab */}
        <TabsContent value="profit-loss" className="space-y-6">
          {plLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Total Revenue"
                  value={formatCurrency(plStatement?.revenue.invoiced || 0)}
                  subtitle="Invoiced amount"
                  icon={TrendingUp}
                  color="green"
                />
                <SummaryCard
                  title="Total Expenses"
                  value={formatCurrency(plStatement?.expenses.total || 0)}
                  subtitle="All costs"
                  icon={TrendingDown}
                  color="red"
                />
                <SummaryCard
                  title="Net Profit"
                  value={formatCurrency(plStatement?.netProfit || 0)}
                  subtitle="After all expenses"
                  icon={DollarSign}
                  color={(plStatement?.netProfit || 0) >= 0 ? "blue" : "red"}
                />
                <SummaryCard
                  title="Profit Margin"
                  value={`${plStatement?.margin?.toFixed(1) || 0}%`}
                  subtitle="Net margin"
                  icon={BarChart3}
                  color="primary"
                />
              </div>

              {/* P&L Statement */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Profit & Loss Statement</CardTitle>
                  <CardDescription>
                    {periodOptions.find((p) => p.value === selectedPeriod)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Revenue Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-green-600 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Revenue
                      </h3>
                      <div className="ml-6 space-y-1">
                        <div className="flex justify-between py-2 border-b">
                          <span>Total Invoiced</span>
                          <span className="font-mono">{formatCurrency(plStatement?.revenue.invoiced || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Collections Received</span>
                          <span className="font-mono">{formatCurrency(plStatement?.revenue.collected || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 font-semibold bg-green-50 dark:bg-green-950/30 px-3 rounded">
                          <span>Total Revenue</span>
                          <span className="font-mono text-green-600">{formatCurrency(plStatement?.revenue.invoiced || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-red-600 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" /> Expenses
                      </h3>
                      <div className="ml-6 space-y-1">
                        <div className="flex justify-between py-2 border-b">
                          <span>Operational Expenses</span>
                          <span className="font-mono">{formatCurrency(plStatement?.expenses.operational || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Salaries & Payroll</span>
                          <span className="font-mono">{formatCurrency(plStatement?.expenses.salaries || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Vendor Payments</span>
                          <span className="font-mono">{formatCurrency(plStatement?.expenses.vendors || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Other Expenses</span>
                          <span className="font-mono">{formatCurrency(plStatement?.expenses.other || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 font-semibold bg-red-50 dark:bg-red-950/30 px-3 rounded">
                          <span>Total Expenses</span>
                          <span className="font-mono text-red-600">{formatCurrency(plStatement?.expenses.total || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="border-t-2 pt-4 space-y-2">
                      <div className="flex justify-between py-2">
                        <span className="font-medium">Gross Profit</span>
                        <span className="font-mono font-semibold">{formatCurrency(plStatement?.grossProfit || 0)}</span>
                      </div>
                      <div className={cn(
                        "flex justify-between py-3 px-4 rounded-lg font-bold text-lg",
                        (plStatement?.netProfit || 0) >= 0
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                          : "bg-red-50 dark:bg-red-950/30 text-red-600"
                      )}>
                        <span>Net Profit</span>
                        <span className="font-mono">{formatCurrency(plStatement?.netProfit || 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance-sheet" className="space-y-6">
          {balanceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Balance Sheet</CardTitle>
                <CardDescription>As of {new Date().toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-green-600 flex items-center gap-2 border-b pb-2">
                      <TrendingUp className="h-5 w-5" /> Assets
                    </h3>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Current Assets</h4>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span>Cash & Bank</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.assets.current.cash || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Accounts Receivable</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.assets.current.accountsReceivable || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 font-semibold">
                          <span>Total Current Assets</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.assets.current.total || 0)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between py-3 px-4 bg-green-50 dark:bg-green-950/30 rounded-lg font-bold">
                        <span>Total Assets</span>
                        <span className="font-mono text-green-600">{formatCurrency(balanceSheet?.assets.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-red-600 flex items-center gap-2 border-b pb-2">
                      <TrendingDown className="h-5 w-5" /> Liabilities & Equity
                    </h3>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Current Liabilities</h4>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span>Accounts Payable</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.liabilities.current.accountsPayable || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Pending Salaries</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.liabilities.current.pendingSalaries || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 font-semibold">
                          <span>Total Current Liabilities</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.liabilities.current.total || 0)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 px-4 bg-red-50 dark:bg-red-950/30 rounded">
                        <span className="font-semibold">Total Liabilities</span>
                        <span className="font-mono text-red-600">{formatCurrency(balanceSheet?.liabilities.total || 0)}</span>
                      </div>

                      <h4 className="font-semibold text-sm text-muted-foreground mt-4">Equity</h4>
                      <div className="ml-4 space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span>Retained Earnings</span>
                          <span className="font-mono">{formatCurrency(balanceSheet?.equity.retainedEarnings || 0)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 px-4 bg-blue-50 dark:bg-blue-950/30 rounded">
                        <span className="font-semibold">Total Equity</span>
                        <span className="font-mono text-blue-600">{formatCurrency(balanceSheet?.equity.total || 0)}</span>
                      </div>

                      <div className="flex justify-between py-3 px-4 bg-muted rounded-lg font-bold mt-4">
                        <span>Total Liabilities + Equity</span>
                        <span className="font-mono">{formatCurrency((balanceSheet?.liabilities.total || 0) + (balanceSheet?.equity.total || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cash-flow" className="space-y-6">
          {cashFlowLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
              </div>
              <Skeleton className="h-80" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Total Inflows"
                  value={formatCurrency(cashFlow?.reduce((sum, c) => sum + c.inflows.total, 0) || 0)}
                  icon={TrendingUp}
                  color="green"
                />
                <SummaryCard
                  title="Total Outflows"
                  value={formatCurrency(cashFlow?.reduce((sum, c) => sum + c.outflows.total, 0) || 0)}
                  icon={TrendingDown}
                  color="red"
                />
                <SummaryCard
                  title="Net Cash Flow"
                  value={formatCurrency(cashFlow?.reduce((sum, c) => sum + c.netCashFlow, 0) || 0)}
                  icon={Wallet}
                  color={(cashFlow?.reduce((sum, c) => sum + c.netCashFlow, 0) || 0) >= 0 ? "blue" : "red"}
                />
                <SummaryCard
                  title="Closing Balance"
                  value={formatCurrency(cashFlow?.[cashFlow.length - 1]?.closingBalance || 0)}
                  icon={PiggyBank}
                  color="primary"
                />
              </div>

              {/* Cash Flow Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Cash Flow Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlow || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="inflows.total" name="Inflows" stroke="#10b981" fill="#10b98133" />
                        <Area type="monotone" dataKey="outflows.total" name="Outflows" stroke="#ef4444" fill="#ef444433" />
                        <Line type="monotone" dataKey="closingBalance" name="Balance" stroke="#3b82f6" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Flow Statement */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Cash Flow Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right text-green-600">Inflows</TableHead>
                        <TableHead className="text-right text-red-600">Outflows</TableHead>
                        <TableHead className="text-right">Net Flow</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashFlow?.map((flow) => (
                        <TableRow key={flow.period}>
                          <TableCell className="font-medium">{flow.period}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(flow.openingBalance)}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{formatCurrency(flow.inflows.total)}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{formatCurrency(flow.outflows.total)}</TableCell>
                          <TableCell className={cn("text-right font-mono font-semibold", flow.netCashFlow >= 0 ? "text-blue-600" : "text-red-600")}>
                            {formatCurrency(flow.netCashFlow)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(flow.closingBalance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* General Ledger Tab */}
        <TabsContent value="general-ledger" className="space-y-6">
          {ledgerLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="Total Entries"
                  value={generalLedger?.length?.toString() || "0"}
                  icon={BookOpen}
                  color="primary"
                />
                <SummaryCard
                  title="Total Debits"
                  value={formatCurrency(generalLedger?.reduce((sum, e) => sum + e.debit, 0) || 0)}
                  icon={ArrowUpRight}
                  color="green"
                />
                <SummaryCard
                  title="Total Credits"
                  value={formatCurrency(generalLedger?.reduce((sum, e) => sum + e.credit, 0) || 0)}
                  icon={ArrowDownRight}
                  color="red"
                />
                <SummaryCard
                  title="Net Balance"
                  value={formatCurrency(generalLedger?.[generalLedger.length - 1]?.balance || 0)}
                  icon={Wallet}
                  color="blue"
                />
              </div>

              {/* Ledger Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    General Ledger
                  </CardTitle>
                  <CardDescription>Complete transaction record with debit/credit entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Voucher No</TableHead>
                          <TableHead>Particulars</TableHead>
                          <TableHead>Account Head</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generalLedger?.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{formatDate(entry.date)}</TableCell>
                            <TableCell className="font-mono text-sm">{entry.voucherNo}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{entry.particulars}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{entry.accountHead}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.debit > 0 ? <span className="text-green-600">{formatCurrency(entry.debit)}</span> : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.credit > 0 ? <span className="text-red-600">{formatCurrency(entry.credit)}</span> : "-"}
                            </TableCell>
                            <TableCell className={cn("text-right font-mono font-medium", entry.balance >= 0 ? "text-blue-600" : "text-red-600")}>
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Trial Balance Tab */}
        <TabsContent value="trial-balance" className="space-y-6">
          {trialBalanceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Balance Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                  title="Total Debit"
                  value={formatCurrency(trialBalance?.totals.debit || 0)}
                  icon={ArrowUpRight}
                  color="green"
                />
                <SummaryCard
                  title="Total Credit"
                  value={formatCurrency(trialBalance?.totals.credit || 0)}
                  icon={ArrowDownRight}
                  color="red"
                />
                <Card className={cn(
                  "border-0 shadow-sm",
                  trialBalance?.totals.isBalanced ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Balance Status</span>
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center",
                        trialBalance?.totals.isBalanced ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {trialBalance?.totals.isBalanced ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className={cn(
                      "text-2xl font-bold",
                      trialBalance?.totals.isBalanced ? "text-green-600" : "text-red-600"
                    )}>
                      {trialBalance?.totals.isBalanced ? "Balanced" : "Unbalanced"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Difference: {formatCurrency(Math.abs((trialBalance?.totals.debit || 0) - (trialBalance?.totals.credit || 0)))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Trial Balance Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Trial Balance
                  </CardTitle>
                  <CardDescription>Summary of all account balances for verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Account Type</TableHead>
                        <TableHead className="text-right">Debit (Dr)</TableHead>
                        <TableHead className="text-right">Credit (Cr)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance?.accounts.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{account.accountName}</TableCell>
                          <TableCell>
                            <Badge variant={
                              account.accountType === "ASSET" ? "default" :
                              account.accountType === "LIABILITY" ? "secondary" :
                              account.accountType === "REVENUE" ? "default" :
                              "outline"
                            } className="text-xs">
                              {account.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {account.debit > 0 ? formatCurrency(account.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {account.credit > 0 ? formatCurrency(account.credit) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {formatCurrency(trialBalance?.totals.debit || 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {formatCurrency(trialBalance?.totals.credit || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Fixed Asset Register Tab */}
        <TabsContent value="fixed-assets" className="space-y-6">
          {assetRegisterLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
              </div>
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <SummaryCard
                  title="Total Assets"
                  value={fixedAssetRegister?.summary.totalAssets?.toString() || "0"}
                  subtitle={`${fixedAssetRegister?.summary.activeAssets || 0} active`}
                  icon={Package}
                  color="primary"
                />
                <SummaryCard
                  title="Purchase Value"
                  value={formatCurrency(fixedAssetRegister?.summary.totalPurchaseValue || 0)}
                  subtitle="Original cost"
                  icon={DollarSign}
                  color="blue"
                />
                <SummaryCard
                  title="Current Value"
                  value={formatCurrency(fixedAssetRegister?.summary.totalCurrentValue || 0)}
                  subtitle="Book value"
                  icon={TrendingDown}
                  color="green"
                />
                <SummaryCard
                  title="Total Depreciation"
                  value={formatCurrency(fixedAssetRegister?.summary.totalDepreciation || 0)}
                  subtitle="Accumulated"
                  icon={TrendingDown}
                  color="red"
                />
                <SummaryCard
                  title="Depreciation %"
                  value={`${fixedAssetRegister?.summary.totalPurchaseValue
                    ? ((fixedAssetRegister.summary.totalDepreciation / fixedAssetRegister.summary.totalPurchaseValue) * 100).toFixed(1)
                    : 0}%`}
                  subtitle="Of total value"
                  icon={BarChart3}
                  color="amber"
                />
              </div>

              {/* Category Summary */}
              {fixedAssetRegister?.summary.categoryWise && fixedAssetRegister.summary.categoryWise.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Asset Summary by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={fixedAssetRegister.summary.categoryWise}
                              dataKey="currentValue"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {fixedAssetRegister.summary.categoryWise.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Purchase</TableHead>
                            <TableHead className="text-right">Current</TableHead>
                            <TableHead className="text-right">Depreciation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fixedAssetRegister.summary.categoryWise.map((cat) => (
                            <TableRow key={cat.category}>
                              <TableCell className="font-medium">{cat.category}</TableCell>
                              <TableCell className="text-right">{cat.count}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(cat.purchaseValue)}</TableCell>
                              <TableCell className="text-right font-mono text-green-600">{formatCurrency(cat.currentValue)}</TableCell>
                              <TableCell className="text-right font-mono text-red-600">{formatCurrency(cat.depreciation)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Asset Register Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Fixed Asset Register
                  </CardTitle>
                  <CardDescription>Complete list of fixed assets with depreciation calculations</CardDescription>
                </CardHeader>
                <CardContent>
                  {fixedAssetRegister?.assets && fixedAssetRegister.assets.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Purchase Date</TableHead>
                            <TableHead className="text-right">Purchase Value</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Rate/Life</TableHead>
                            <TableHead className="text-right">Depreciation</TableHead>
                            <TableHead className="text-right">Current Value</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fixedAssetRegister.assets.map((asset) => (
                            <TableRow key={asset.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{asset.name}</p>
                                  {asset.location && <p className="text-xs text-muted-foreground">{asset.location}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{asset.category}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{formatDate(asset.purchaseDate)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(asset.purchaseValue)}</TableCell>
                              <TableCell className="text-xs">
                                {asset.depreciationMethod === "STRAIGHT_LINE" ? "SLM" :
                                 asset.depreciationMethod === "WRITTEN_DOWN" ? "WDV" : "None"}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {asset.depreciationMethod === "WRITTEN_DOWN"
                                  ? `${asset.depreciationRate}%`
                                  : `${asset.usefulLifeYears} yrs`}
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-600">
                                {formatCurrency(asset.accumulatedDepreciation)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-green-600">
                                {formatCurrency(asset.currentValue)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={asset.status === "ACTIVE" ? "default" : "secondary"}>
                                  {asset.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No fixed assets recorded yet.</p>
                      <p className="text-sm">Add fixed assets to track depreciation for Income Tax compliance.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* GST GSTR-3B Summary Tab */}
        <TabsContent value="gst-summary" className="space-y-6">
          {gstr3bLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
              </div>
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Net Tax Payable Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Net Tax Payable</span>
                      <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <IndianRupee className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(gstr3bSummary?.netTaxPayable.total || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total GST to be paid</p>
                  </CardContent>
                </Card>
                <SummaryCard
                  title="Output Tax"
                  value={formatCurrency(gstr3bSummary?.outwardSupplies.totalTax || 0)}
                  subtitle="On sales"
                  icon={TrendingUp}
                  color="blue"
                />
                <SummaryCard
                  title="Input Tax Credit"
                  value={formatCurrency(gstr3bSummary?.inputTaxCredit.totalItc || 0)}
                  subtitle="From purchases"
                  icon={TrendingDown}
                  color="green"
                />
                <SummaryCard
                  title="ITC Utilized"
                  value={formatCurrency(gstr3bSummary?.itcUtilization.total || 0)}
                  subtitle="Credit adjusted"
                  icon={CheckCircle}
                  color="primary"
                />
              </div>

              {/* GSTR-3B Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Outward Supplies */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                      <TrendingUp className="h-5 w-5" />
                      3.1 Outward Supplies (Output Tax)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Taxable Value</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.taxableValue || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">CGST @ 9%</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.cgst || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">SGST @ 9%</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.sgst || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">IGST @ 18%</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.igst || 0)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50 dark:bg-blue-950/30 font-bold">
                          <TableCell>Total Output Tax</TableCell>
                          <TableCell className="text-right font-mono text-blue-600">{formatCurrency(gstr3bSummary?.outwardSupplies.totalTax || 0)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Input Tax Credit */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                      <TrendingDown className="h-5 w-5" />
                      4. Input Tax Credit (ITC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Taxable Value</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.inputTaxCredit.taxableValue || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">CGST Credit</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.inputTaxCredit.cgst || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">SGST Credit</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.inputTaxCredit.sgst || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">IGST Credit</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.inputTaxCredit.igst || 0)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-green-50 dark:bg-green-950/30 font-bold">
                          <TableCell>Total ITC Available</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{formatCurrency(gstr3bSummary?.inputTaxCredit.totalItc || 0)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Net Tax Payable Calculation */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                    <IndianRupee className="h-5 w-5" />
                    6.1 Net Tax Payable
                  </CardTitle>
                  <CardDescription>Output Tax - Input Tax Credit = Net Payable</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tax Type</TableHead>
                        <TableHead className="text-right">Output Tax</TableHead>
                        <TableHead className="text-right">ITC Utilized</TableHead>
                        <TableHead className="text-right">Net Payable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">CGST</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.cgst || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">-{formatCurrency(gstr3bSummary?.itcUtilization.cgst || 0)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(gstr3bSummary?.netTaxPayable.cgst || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">SGST</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.sgst || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">-{formatCurrency(gstr3bSummary?.itcUtilization.sgst || 0)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(gstr3bSummary?.netTaxPayable.sgst || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">IGST</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.igst || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">-{formatCurrency(gstr3bSummary?.itcUtilization.igst || 0)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(gstr3bSummary?.netTaxPayable.igst || 0)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-orange-50 dark:bg-orange-950/30 font-bold text-lg">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(gstr3bSummary?.outwardSupplies.totalTax || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">-{formatCurrency(gstr3bSummary?.itcUtilization.total || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-orange-600">{formatCurrency(gstr3bSummary?.netTaxPayable.total || 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* GST Sales Register Tab */}
        <TabsContent value="gst-sales" className="space-y-6">
          {gstSalesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <SummaryCard
                  title="Total Invoices"
                  value={gstSalesRegister?.summary.totalInvoices?.toString() || "0"}
                  subtitle={`B2B: ${gstSalesRegister?.summary.b2bInvoices || 0} | B2C: ${gstSalesRegister?.summary.b2cInvoices || 0}`}
                  icon={FileText}
                  color="primary"
                />
                <SummaryCard
                  title="Taxable Value"
                  value={formatCurrency(gstSalesRegister?.summary.totalTaxableValue || 0)}
                  icon={DollarSign}
                  color="blue"
                />
                <SummaryCard
                  title="CGST"
                  value={formatCurrency(gstSalesRegister?.summary.totalCgst || 0)}
                  subtitle="@ 9%"
                  icon={IndianRupee}
                  color="green"
                />
                <SummaryCard
                  title="SGST"
                  value={formatCurrency(gstSalesRegister?.summary.totalSgst || 0)}
                  subtitle="@ 9%"
                  icon={IndianRupee}
                  color="green"
                />
                <SummaryCard
                  title="Total GST"
                  value={formatCurrency(gstSalesRegister?.summary.totalGst || 0)}
                  subtitle="Output Tax"
                  icon={IndianRupee}
                  color="amber"
                />
              </div>

              {/* Sales Register Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    GSTR-1 Sales Register (Outward Supplies)
                  </CardTitle>
                  <CardDescription>Invoice-wise details of outward supplies for GST filing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Client / GSTIN</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Taxable</TableHead>
                          <TableHead className="text-right">CGST</TableHead>
                          <TableHead className="text-right">SGST</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gstSalesRegister?.entries.map((entry) => (
                          <TableRow key={entry.invoiceNumber}>
                            <TableCell className="font-mono text-sm">{entry.invoiceNumber}</TableCell>
                            <TableCell className="text-sm">{formatDate(entry.invoiceDate)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{entry.clientName}</p>
                                <p className="text-xs text-muted-foreground">{entry.gstin}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={entry.invoiceType === "B2B" ? "default" : "secondary"}>
                                {entry.invoiceType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(entry.taxableValue)}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{formatCurrency(entry.cgst)}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{formatCurrency(entry.sgst)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(entry.invoiceValue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* GST Purchase Register Tab */}
        <TabsContent value="gst-purchase" className="space-y-6">
          {gstPurchaseLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <SummaryCard
                  title="Total Entries"
                  value={gstPurchaseRegister?.summary.totalEntries?.toString() || "0"}
                  subtitle={`ITC Eligible: ${gstPurchaseRegister?.summary.eligibleForItc || 0}`}
                  icon={ShoppingCart}
                  color="primary"
                />
                <SummaryCard
                  title="Total Purchases"
                  value={formatCurrency(gstPurchaseRegister?.summary.totalPurchaseValue || 0)}
                  icon={DollarSign}
                  color="blue"
                />
                <SummaryCard
                  title="Total GST Paid"
                  value={formatCurrency(gstPurchaseRegister?.summary.totalGst || 0)}
                  icon={IndianRupee}
                  color="red"
                />
                <SummaryCard
                  title="Eligible ITC"
                  value={formatCurrency(gstPurchaseRegister?.summary.eligibleItc || 0)}
                  subtitle="From registered vendors"
                  icon={CheckCircle}
                  color="green"
                />
                <SummaryCard
                  title="ITC Not Eligible"
                  value={formatCurrency((gstPurchaseRegister?.summary.totalGst || 0) - (gstPurchaseRegister?.summary.eligibleItc || 0))}
                  subtitle="Unregistered vendors"
                  icon={XCircle}
                  color="red"
                />
              </div>

              {/* Purchase Register Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Purchase Register (Input Tax)
                  </CardTitle>
                  <CardDescription>Details of inward supplies for Input Tax Credit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Voucher</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor / GSTIN</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Taxable</TableHead>
                          <TableHead className="text-right">GST</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>ITC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gstPurchaseRegister?.entries.map((entry) => (
                          <TableRow key={entry.voucherNumber}>
                            <TableCell className="font-mono text-sm">{entry.voucherNumber}</TableCell>
                            <TableCell className="text-sm">{formatDate(entry.voucherDate)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{entry.vendorName}</p>
                                <p className="text-xs text-muted-foreground">{entry.gstin}</p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">{entry.description}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(entry.taxableValue)}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">{formatCurrency(entry.totalGst)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(entry.totalValue)}</TableCell>
                            <TableCell>
                              {entry.itcEligible ? (
                                <Badge variant="default" className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Yes
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  <XCircle className="h-3 w-3 mr-1" /> No
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* HSN/SAC Summary Tab */}
        <TabsContent value="gst-hsn" className="space-y-6">
          {hsnLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  title="SAC Codes"
                  value={hsnSummary?.entries.length?.toString() || "0"}
                  subtitle="Service categories"
                  icon={FileSpreadsheet}
                  color="primary"
                />
                <SummaryCard
                  title="Total Quantity"
                  value={hsnSummary?.totals.totalQuantity?.toString() || "0"}
                  subtitle="Invoices"
                  icon={FileText}
                  color="blue"
                />
                <SummaryCard
                  title="Taxable Value"
                  value={formatCurrency(hsnSummary?.totals.totalTaxableValue || 0)}
                  icon={DollarSign}
                  color="green"
                />
                <SummaryCard
                  title="Total Tax"
                  value={formatCurrency(hsnSummary?.totals.totalTax || 0)}
                  icon={IndianRupee}
                  color="amber"
                />
              </div>

              {/* HSN Summary Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    HSN/SAC Summary
                  </CardTitle>
                  <CardDescription>Summary of supplies by SAC code for GSTR-1 filing</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SAC Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hsnSummary?.entries.map((entry) => (
                        <TableRow key={entry.hsnCode}>
                          <TableCell className="font-mono font-semibold">{entry.hsnCode}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-right">{entry.quantity}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.taxableValue)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.cgst)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.sgst)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(entry.totalTax)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">{hsnSummary?.totals.totalQuantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(hsnSummary?.totals.totalTaxableValue || 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(hsnSummary?.totals.totalCgst || 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(hsnSummary?.totals.totalSgst || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-orange-600">{formatCurrency(hsnSummary?.totals.totalTax || 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* GST Rate-wise Summary Tab */}
        <TabsContent value="gst-rate" className="space-y-6">
          {gstRateLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <>
              {/* Rate-wise Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Tax Collection by Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gstRateSummary || []}>
                          <XAxis dataKey="rate" tickFormatter={(v) => `${v}%`} />
                          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="totalTax" name="Total Tax" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Value by Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gstRateSummary || []}
                            dataKey="invoiceValue"
                            nameKey="rate"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ rate, percent }) => `${rate}%: ${(percent * 100).toFixed(0)}%`}
                          >
                            {gstRateSummary?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend formatter={(value) => `${value}% GST`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rate-wise Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    GST Rate-wise Summary
                  </CardTitle>
                  <CardDescription>Breakdown of supplies by GST rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GST Rate</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                        <TableHead className="text-right">Invoice Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstRateSummary?.map((entry) => (
                        <TableRow key={entry.rate}>
                          <TableCell>
                            <Badge variant="outline" className="text-sm font-mono">
                              {entry.rate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{entry.invoiceCount}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.taxableValue)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.cgst)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.sgst)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(entry.igst)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-orange-600">{formatCurrency(entry.totalTax)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(entry.invoiceValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
        )}
      </div>
    </div>
  );
}
