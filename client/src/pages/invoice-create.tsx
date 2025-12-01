import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Package, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { QuickClientDialog } from "@/components/quick-client-dialog";
import type { Client, Project, Service } from "@shared/schema";

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("FIXED"),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(0.01),
      unitPrice: z.number().min(0),
    })
  ).min(1, "At least one line item is required"),
  status: z.enum(["DRAFT", "SENT"]),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export default function InvoiceCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedClientId = urlParams.get("clientId");

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: preSelectedClientId || "",
      projectId: "",
      invoiceNumber: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      taxRate: 18,
      discount: 0,
      discountType: "FIXED",
      notes: "",
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
      status: "DRAFT",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients", { status: "ACTIVE" }],
  });

  const selectedClientId = form.watch("clientId");
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects", { clientId: selectedClientId }],
    enabled: !!selectedClientId,
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const activeServices = services?.filter((s) => 
    s.status === "ACTIVE" && 
    s.defaultPrice != null && 
    s.defaultPrice > 0
  ) || [];

  const lineItems = form.watch("lineItems");
  const taxRate = form.watch("taxRate");
  const discount = form.watch("discount") || 0;
  const discountType = form.watch("discountType") || "FIXED";

  const subtotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  
  // Calculate discount amount
  const discountAmount = discountType === "PERCENTAGE"
    ? (subtotal * discount) / 100
    : discount;
  
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (afterDiscount * (taxRate || 0)) / 100;
  const total = afterDiscount + taxAmount;

  const handleAddService = (service: Service) => {
    if (!service.defaultPrice || service.defaultPrice <= 0) {
      toast({
        title: "Invalid service",
        description: "This service does not have a valid default price",
        variant: "destructive",
      });
      return;
    }

    append({
      description: `${service.name}${service.description ? ' - ' + service.description : ''}`,
      quantity: 1,
      unitPrice: service.defaultPrice,
    });
    setServicePopoverOpen(false);
    toast({
      title: "Service added",
      description: `${service.name} has been added to the invoice`,
    });
  };

  const mutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const payload = {
        clientId: data.clientId,
        projectId: data.projectId || null,
        invoiceNumber: data.invoiceNumber || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: "INR",
        subtotal,
        discount: discount,
        discountType: discountType,
        taxAmount,
        totalAmount: total,
        status: data.status,
        notes: data.notes || "",
        lineItems: data.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
        })),
      };
      return apiRequest("POST", "/api/invoices", payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice created",
        description: "Successfully created invoice",
      });
      setLocation(`/invoices/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create Invoice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a new invoice for your client
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Client *</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-primary"
                          onClick={() => setShowQuickClient(true)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add New
                        </Button>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedClientId}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="No project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number (Auto-generated if empty)</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-0001" {...field} data-testid="input-invoice-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-tax-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount {discountType === "PERCENTAGE" ? "(%)" : "(Amount)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-discount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-issue-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or payment terms..."
                        className="min-h-20"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle>Line Items</CardTitle>
                <div className="flex gap-2">
                  <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="button-add-from-service"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Add from Service
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-3 border-b">
                        <h4 className="font-medium text-sm">Select a Service</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Quick add from service catalog
                        </p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {activeServices.length > 0 ? (
                          <div className="p-2">
                            {activeServices.map((service) => (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => handleAddService(service)}
                                className="w-full text-left p-3 rounded-md hover-elevate active-elevate-2 flex flex-col gap-2"
                                data-testid={`button-service-${service.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{service.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {service.category.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-0.5">
                                    <span className="font-mono font-medium text-sm">
                                      {service.currency} {service.defaultPrice.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      per {service.unit}
                                    </span>
                                  </div>
                                </div>
                                {service.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {service.description}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground">No services available</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Add services in Settings
                            </p>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                    data-testid="button-add-line-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-32">Quantity</TableHead>
                    <TableHead className="w-40">Unit Price</TableHead>
                    <TableHead className="w-40 text-right">Line Total</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Service or product description"
                                  {...field}
                                  data-testid={`input-description-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid={`input-quantity-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid={`input-unit-price-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`text-line-total-${index}`}>
                        {formatCurrency(
                          (lineItems[index]?.quantity || 0) * (lineItems[index]?.unitPrice || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-mono" data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Discount {discountType === "PERCENTAGE" ? `(${discount}%)` : ""}:</span>
                      <span className="font-mono" data-testid="text-discount">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                    <span className="font-mono" data-testid="text-tax">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span className="font-mono" data-testid="text-total">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link href="/invoices">
              <Button type="button" variant="outline" data-testid="button-cancel">
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.setValue("status", "DRAFT");
                form.handleSubmit((data) => mutation.mutate(data))();
              }}
              disabled={mutation.isPending}
              data-testid="button-save-draft"
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              onClick={() => form.setValue("status", "SENT")}
              disabled={mutation.isPending}
              data-testid="button-mark-sent"
            >
              {mutation.isPending ? "Creating..." : "Mark as Sent"}
            </Button>
          </div>
        </form>
      </Form>

      <QuickClientDialog
        open={showQuickClient}
        onClose={() => setShowQuickClient(false)}
        onClientCreated={(clientId) => {
          form.setValue("clientId", clientId);
          setShowQuickClient(false);
        }}
      />
    </div>
  );
}
