import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicePDF } from "@/components/invoice-pdf";
import { Plus, Search, Trash2, MoreHorizontal, Mail, Eye, Download, Loader2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import type { InvoiceWithRelations, CompanyProfile, Client, Payment } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { generateUPIQRCode } from "@/lib/qrcode";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { convertImageForPdf } from "@/lib/pdf-utils";

export default function InvoicesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [sendEmailDialog, setSendEmailDialog] = useState<InvoiceWithRelations | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

  const { data: invoices, isLoading } = useQuery<InvoiceWithRelations[]>({
    queryKey: ["/api/invoices", { status: statusFilter === "all" ? undefined : statusFilter, search }],
  });

  const { data: companyProfile } = useQuery<CompanyProfile>({
    queryKey: ["/api/settings/company"],
    queryFn: async () => {
      return apiRequest("GET", "/api/settings/company");
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Helper to get client details
  const getClientForInvoice = (invoice: InvoiceWithRelations | null) => {
    if (!invoice) return null;
    return clients?.find(c => c.id === invoice.clientId);
  };

  // Download PDF function
  const handleDownloadPdf = async (invoice: InvoiceWithRelations) => {
    try {
      setDownloadingPdf(invoice.id);
      const client = getClientForInvoice(invoice);

      // Fetch payments for this invoice
      let payments: Payment[] = [];
      try {
        payments = await apiRequest("GET", `/api/invoices/${invoice.id}/payments`);
      } catch (e) {
        console.error("Failed to fetch payments:", e);
      }

      // Generate UPI QR code if UPI ID is configured
      let upiQrCode: string | undefined;
      if (companyProfile?.upiId) {
        try {
          upiQrCode = await generateUPIQRCode(
            companyProfile.upiId,
            companyProfile.companyName || "Company",
            invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount,
            invoice.invoiceNumber
          );
        } catch (e) {
          console.error("Failed to generate UPI QR code:", e);
        }
      }

      // Convert logo to PDF-compatible format (handles SVG, remote URLs, etc.)
      let logoForPdf = logoBase64;
      if (!logoForPdf && companyProfile?.logoUrl) {
        logoForPdf = await convertImageForPdf(companyProfile.logoUrl);
        if (logoForPdf) {
          setLogoBase64(logoForPdf); // Cache it for future use
        }
      }

      const clientAddress = client
        ? [client.address, client.companyWebsite].filter(Boolean).join(", ")
        : undefined;

      const blob = await pdf(
        <InvoicePDF
          invoice={invoice}
          companyProfile={companyProfile}
          clientAddress={clientAddress}
          clientEmail={client?.email}
          payments={payments}
          upiQrCode={upiQrCode}
          logoBase64={logoForPdf}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Send email function
  const handleSendEmail = async () => {
    if (!sendEmailDialog) return;

    setSendingEmail(true);
    try {
      const client = getClientForInvoice(sendEmailDialog);

      // Fetch payments for this invoice
      let payments: Payment[] = [];
      try {
        payments = await apiRequest("GET", `/api/invoices/${sendEmailDialog.id}/payments`);
      } catch (e) {
        console.error("Failed to fetch payments:", e);
      }

      // Generate UPI QR code if UPI ID is configured
      let upiQrCode: string | undefined;
      if (companyProfile?.upiId) {
        try {
          upiQrCode = await generateUPIQRCode(
            companyProfile.upiId,
            companyProfile.companyName || "Company",
            sendEmailDialog.balanceDue > 0 ? sendEmailDialog.balanceDue : sendEmailDialog.totalAmount,
            sendEmailDialog.invoiceNumber
          );
        } catch (e) {
          console.error("Failed to generate UPI QR code:", e);
        }
      }

      const clientAddress = client
        ? [client.address, client.companyWebsite].filter(Boolean).join(", ")
        : undefined;

      // Convert logo to PDF-compatible format (handles SVG, remote URLs, etc.)
      let logoForPdf = logoBase64;
      if (!logoForPdf && companyProfile?.logoUrl) {
        logoForPdf = await convertImageForPdf(companyProfile.logoUrl);
        if (logoForPdf) {
          setLogoBase64(logoForPdf); // Cache it for future use
        }
      }

      // Generate PDF as base64
      const blob = await pdf(
        <InvoicePDF
          invoice={sendEmailDialog}
          companyProfile={companyProfile}
          clientAddress={clientAddress}
          clientEmail={client?.email}
          payments={payments}
          upiQrCode={upiQrCode}
          logoBase64={logoForPdf}
        />
      ).toBlob();

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      await apiRequest("POST", `/api/invoices/${sendEmailDialog.id}/send-email`, {
        customMessage: emailMessage,
        pdfBase64: base64,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Email Sent",
        description: `Invoice has been sent to ${client?.email || "the client"}.`,
      });
      setSendEmailDialog(null);
      setEmailMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/invoices/${invoice.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => handleDownloadPdf(invoice)}
                            disabled={downloadingPdf === invoice.id}
                          >
                            {downloadingPdf === invoice.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSendEmailDialog(invoice)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingInvoice(invoice)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Send Email Dialog */}
      <Dialog open={!!sendEmailDialog} onOpenChange={(open) => !open && setSendEmailDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Invoice via Email
            </DialogTitle>
            <DialogDescription>
              Send invoice {sendEmailDialog?.invoiceNumber} to{" "}
              <span className="font-medium">{getClientForInvoice(sendEmailDialog)?.email || "client"}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-message">Custom Message (Optional)</Label>
              <Textarea
                id="email-message"
                placeholder="Add a personal message to include in the email..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This message will appear in the email body before the invoice details.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">Invoice Details</p>
              <p className="text-sm text-muted-foreground">
                Invoice #: {sendEmailDialog?.invoiceNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                Amount: {sendEmailDialog ? formatCurrency(sendEmailDialog.totalAmount) : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                Due: {sendEmailDialog ? formatDate(sendEmailDialog.dueDate) : ""}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSendEmailDialog(null);
                setEmailMessage("");
              }}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
