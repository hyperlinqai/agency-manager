import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  TrendingDown, 
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { DashboardSummary, InvoiceWithRelations, FinancialSummary } from "@shared/schema";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  const { data: upcomingInvoices, isLoading: invoicesLoading } = useQuery<InvoiceWithRelations[]>({
    queryKey: ["/api/invoices/upcoming"],
  });

  const { data: financialSummary, isLoading: financialLoading } = useQuery<FinancialSummary>({
    queryKey: ["/api/dashboard/financial"],
  });

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    loading,
    trend,
    trendValue,
    iconColor,
  }: {
    title: string;
    value: string;
    icon: any;
    loading: boolean;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    iconColor?: string;
  }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center",
          iconColor || "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            iconColor?.includes("green") ? "text-green-600" :
            iconColor?.includes("blue") ? "text-blue-600" :
            iconColor?.includes("amber") ? "text-amber-600" :
            iconColor?.includes("purple") ? "text-purple-600" :
            "text-primary"
          )} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </div>
            {trend && trendValue && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FinancialCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: "green" | "red" | "blue" | "amber";
  }) => {
    const colorClasses = {
      green: {
        bg: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-200 dark:border-green-900",
        icon: "text-green-600",
        text: "text-green-700 dark:text-green-400",
      },
      red: {
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-200 dark:border-red-900",
        icon: "text-red-600",
        text: "text-red-700 dark:text-red-400",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-900",
        icon: "text-blue-600",
        text: "text-blue-700 dark:text-blue-400",
      },
      amber: {
        bg: "bg-amber-50 dark:bg-amber-950/50",
        border: "border-amber-200 dark:border-amber-900",
        icon: "text-amber-600",
        text: "text-amber-700 dark:text-amber-400",
      },
    };

    const classes = colorClasses[color];

    return (
      <div className={cn("rounded-xl border p-5 transition-all hover:shadow-sm", classes.bg, classes.border)}>
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <Icon className={cn("h-4 w-4", classes.icon)} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className={cn("text-2xl font-bold font-mono", classes.text)}>
          {value}
        </div>
        <p className="text-xs mt-1 text-muted-foreground">{subtitle}</p>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(summary?.totalInvoiced || 0)}
          icon={DollarSign}
          loading={summaryLoading}
          iconColor="bg-green-100 dark:bg-green-950"
          trend="up"
          trendValue="All time"
        />
        <MetricCard
          title="Collected"
          value={formatCurrency(summary?.totalPaid || 0)}
          icon={TrendingUp}
          loading={summaryLoading}
          iconColor="bg-blue-100 dark:bg-blue-950"
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(summary?.totalOutstanding || 0)}
          icon={AlertCircle}
          loading={summaryLoading}
          iconColor="bg-amber-100 dark:bg-amber-950"
        />
        <MetricCard
          title="Active Clients"
          value={summary?.countActiveClients?.toString() || "0"}
          icon={Users}
          loading={summaryLoading}
          iconColor="bg-purple-100 dark:bg-purple-950"
        />
      </div>

      {/* This Month Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Receipt className="h-4 w-4" />
              This Month Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono" data-testid="metric-this-month-invoiced">
                {formatCurrency(summary?.thisMonthInvoiced || 0)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              This Month Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold font-mono text-green-600" data-testid="metric-this-month-collected">
                {formatCurrency(summary?.thisMonthCollected || 0)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className={cn(
                "text-2xl font-bold",
                (summary?.countOverdueInvoices || 0) > 0 ? "text-red-600" : "text-green-600"
              )} data-testid="metric-overdue-count">
                {summary?.countOverdueInvoices || 0}
                <span className="text-sm font-normal ml-2 text-muted-foreground">
                  {(summary?.countOverdueInvoices || 0) === 1 ? "invoice" : "invoices"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Financial Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">All-time performance metrics</p>
        </CardHeader>
        <CardContent>
          {financialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialCard
                title="Total Income"
                value={formatCurrency(financialSummary?.totalIncome || 0)}
                subtitle="From paid invoices"
                icon={TrendingUp}
                color="green"
              />
              <FinancialCard
                title="Total Expenses"
                value={formatCurrency(financialSummary?.totalExpenses || 0)}
                subtitle="All business costs"
                icon={TrendingDown}
                color="red"
              />
              <FinancialCard
                title="Net Profit"
                value={formatCurrency(financialSummary?.netProfit || 0)}
                subtitle="Income - Expenses"
                icon={Wallet}
                color={(financialSummary?.netProfit || 0) >= 0 ? "green" : "red"}
              />
              <FinancialCard
                title="Profit Margin"
                value={financialSummary?.totalIncome && financialSummary.totalIncome > 0
                  ? `${((financialSummary.netProfit / financialSummary.totalIncome) * 100).toFixed(1)}%`
                  : "0%"}
                subtitle="Net margin ratio"
                icon={DollarSign}
                color="blue"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Invoices */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Due Dates
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Invoices due in the next 30 days</p>
          </div>
          <Link href="/invoices" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !upcomingInvoices || upcomingInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No upcoming invoices</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                All invoices are paid or have later due dates
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Invoice #</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Client</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Project</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Balance</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Due Date</TableHead>
                    <TableHead className="pr-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingInvoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id} 
                      className="border-none hover:bg-muted/30 cursor-pointer transition-colors"
                      data-testid={`row-invoice-${invoice.id}`}
                    >
                      <TableCell className="pl-6">
                        <Link href={`/invoices/${invoice.id}`}>
                          <span className="font-mono text-sm font-medium text-primary hover:underline" data-testid={`text-invoice-number-${invoice.id}`}>
                            {invoice.invoiceNumber}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-client-${invoice.id}`}>
                        {invoice.clientName}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-project-${invoice.id}`}>
                        {invoice.projectName || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm" data-testid={`text-amount-${invoice.id}`}>
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium" data-testid={`text-balance-${invoice.id}`}>
                        {formatCurrency(invoice.balanceDue)}
                      </TableCell>
                      <TableCell data-testid={`text-due-date-${invoice.id}`}>
                        <span className="text-sm">{formatDate(invoice.dueDate)}</span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <StatusBadge status={invoice.status} type="invoice" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
