import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import type { InvoiceWithRelations } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InvoicesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithRelations | null>(null);

  const { data: invoices, isLoading } = useQuery<InvoiceWithRelations[]>({
    queryKey: ["/api/invoices", { status: statusFilter === "all" ? undefined : statusFilter, search }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Success", description: "Invoice deleted successfully" });
      setDeletingInvoice(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredInvoices = invoices || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage invoices and track payments
          </p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-invoices"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No invoices found</p>
            <Link href="/invoices/new">
              <Button
                variant="ghost"
                className="mt-2"
                data-testid="button-create-first-invoice"
              >
                Create your first invoice
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="text-right">Invoice Value</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-mono text-sm font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell data-testid={`text-client-${invoice.id}`}>{invoice.clientName}</TableCell>
                    <TableCell data-testid={`text-project-${invoice.id}`}>{invoice.projectName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-scope-${invoice.id}`}>
                      {invoice.projectScope || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-total-${invoice.id}`}>
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell data-testid={`text-due-date-${invoice.id}`}>
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-paid-${invoice.id}`}>
                      {formatCurrency(invoice.amountPaid)}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-balance-${invoice.id}`}>
                      {formatCurrency(invoice.balanceDue)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} type="invoice" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-${invoice.id}`}>
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingInvoice(invoice)}
                          data-testid={`button-delete-${invoice.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
        onConfirm={() => deletingInvoice && deleteMutation.mutate(deletingInvoice.id)}
        title="Delete Invoice"
        itemName={deletingInvoice?.invoiceNumber}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
