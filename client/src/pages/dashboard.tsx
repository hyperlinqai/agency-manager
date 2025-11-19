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
import { DollarSign, TrendingUp, AlertCircle, Users, TrendingDown, Wallet } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary, InvoiceWithRelations, FinancialSummary } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";

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
  }: {
    title: string;
    value: string;
    icon: any;
    loading: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="text-2xl font-semibold font-mono" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your agency's financial performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Invoiced"
          value={formatCurrency(summary?.totalInvoiced || 0)}
          icon={DollarSign}
          loading={summaryLoading}
        />
        <MetricCard
          title="Total Paid"
          value={formatCurrency(summary?.totalPaid || 0)}
          icon={TrendingUp}
          loading={summaryLoading}
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(summary?.totalOutstanding || 0)}
          icon={AlertCircle}
          loading={summaryLoading}
        />
        <MetricCard
          title="Active Clients"
          value={summary?.countActiveClients?.toString() || "0"}
          icon={Users}
          loading={summaryLoading}
        />
      </div>

      {/* This Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-xl font-semibold font-mono" data-testid="metric-this-month-invoiced">
                {formatCurrency(summary?.thisMonthInvoiced || 0)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month Collected</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-xl font-semibold font-mono" data-testid="metric-this-month-collected">
                {formatCurrency(summary?.thisMonthCollected || 0)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-semibold" data-testid="metric-overdue-count">
                {summary?.countOverdueInvoices || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Financial Overview (All Time)</CardTitle>
        </CardHeader>
        <CardContent>
          {financialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total Income</span>
                </div>
                <div className="text-2xl font-semibold font-mono text-green-600" data-testid="metric-total-income">
                  {formatCurrency(financialSummary?.totalIncome || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">From invoices</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <TrendingDown className="h-4 w-4" />
                  <span>Total Expenses</span>
                </div>
                <div className="text-2xl font-semibold font-mono text-red-600" data-testid="metric-total-expenses">
                  {formatCurrency(financialSummary?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All business costs</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Wallet className="h-4 w-4" />
                  <span>Net Profit/Loss</span>
                </div>
                <div
                  className={`text-2xl font-semibold font-mono ${
                    (financialSummary?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                  data-testid="metric-net-profit"
                >
                  {formatCurrency(financialSummary?.netProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Income - Expenses</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Profit Margin</span>
                </div>
                <div className="text-2xl font-semibold" data-testid="metric-profit-margin">
                  {financialSummary?.totalIncome && financialSummary.totalIncome > 0
                    ? `${((financialSummary.netProfit / financialSummary.totalIncome) * 100).toFixed(1)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Net margin</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Upcoming Invoice Due Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !upcomingInvoices || upcomingInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming invoices</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-invoice-number-${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell data-testid={`text-client-${invoice.id}`}>{invoice.clientName}</TableCell>
                      <TableCell data-testid={`text-project-${invoice.id}`}>{invoice.projectName || "—"}</TableCell>
                      <TableCell className="text-right font-mono" data-testid={`text-amount-${invoice.id}`}>
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`text-balance-${invoice.id}`}>
                        {formatCurrency(invoice.balanceDue)}
                      </TableCell>
                      <TableCell data-testid={`text-due-date-${invoice.id}`}>
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell>
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
