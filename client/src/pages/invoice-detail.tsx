import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus } from "lucide-react";
import { PaymentDialog } from "@/components/payment-dialog";
import type { InvoiceWithRelations, Payment } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id;
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery<InvoiceWithRelations>({
    queryKey: ["/api/invoices", invoiceId],
    enabled: !!invoiceId,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/invoices", invoiceId, "payments"],
    enabled: !!invoiceId,
  });


  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <p>Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-mono" data-testid="text-invoice-number">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} type="invoice" />
          {invoice.status !== "PAID" && (
            <Button onClick={() => setIsPaymentDialogOpen(true)} data-testid="button-record-payment">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Client</p>
                <p className="text-sm font-medium" data-testid="text-client">{invoice.clientName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Project</p>
                <p className="text-sm" data-testid="text-project">{invoice.projectName || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Issue Date</p>
                <p className="text-sm" data-testid="text-issue-date">
                  {formatDate(invoice.issueDate, "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Due Date</p>
                <p className="text-sm" data-testid="text-due-date">
                  {formatDate(invoice.dueDate, "MMMM dd, yyyy")}
                </p>
              </div>
              {invoice.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems?.map((item, index) => (
                    <TableRow key={item.id} data-testid={`row-line-item-${index}`}>
                      <TableCell data-testid={`text-description-${index}`}>{item.description}</TableCell>
                      <TableCell className="text-right" data-testid={`text-quantity-${index}`}>{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono" data-testid={`text-unit-price-${index}`}>
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`text-line-total-${index}`}>
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-mono" data-testid="text-subtotal">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-mono" data-testid="text-tax">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="font-mono" data-testid="text-total">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Paid:</span>
                    <span className="font-mono" data-testid="text-paid">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Balance Due:</span>
                    <span className="font-mono" data-testid="text-balance">{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Amount</p>
                <p className="text-2xl font-semibold font-mono" data-testid="metric-total">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Amount Paid</p>
                <p className="text-2xl font-semibold font-mono text-green-600" data-testid="metric-paid">
                  {formatCurrency(invoice.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Balance Due</p>
                <p className="text-2xl font-semibold font-mono text-orange-600" data-testid="metric-balance">
                  {formatCurrency(invoice.balanceDue)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-start border-b pb-3 last:border-0"
                      data-testid={`payment-${payment.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium" data-testid={`payment-amount-${payment.id}`}>
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`payment-date-${payment.id}`}>
                          {formatDate(payment.paymentDate)}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`payment-method-${payment.id}`}>
                          {payment.method ? payment.method.replace(/_/g, " ") : "—"}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground" data-testid={`payment-reference-${payment.id}`}>
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        invoiceId={invoiceId!}
        maxAmount={invoice.balanceDue}
      />
    </div>
  );
}
