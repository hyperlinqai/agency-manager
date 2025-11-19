import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { ClientDialog } from "@/components/client-dialog";
import { ProjectDialog } from "@/components/project-dialog";
import type { Client, Project, InvoiceWithRelations } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { clientId }],
    enabled: !!clientId,
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<InvoiceWithRelations[]>({
    queryKey: ["/api/invoices", { clientId }],
    enabled: !!clientId,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PUT", `/api/clients/${clientId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Status updated",
        description: "Client status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  if (clientLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <p>Client not found</p>
      </div>
    );
  }

  const totalInvoiced =
    invoices?.reduce((sum, inv) => sum + inv.totalAmount, 0) || 0;
  const totalOutstanding =
    invoices?.reduce((sum, inv) => sum + inv.balanceDue, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-client-name">
              {client.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Client Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={client.status}
            onValueChange={(value) => statusMutation.mutate(value)}
          >
            <SelectTrigger className="w-40" data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            data-testid="button-edit-client"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono" data-testid="metric-total-invoiced">
                  {formatCurrency(totalInvoiced)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono" data-testid="metric-outstanding">
                  {formatCurrency(totalOutstanding)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold" data-testid="metric-projects">
                  {projects?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Contact Person</p>
                <p className="text-sm" data-testid="text-contact-name">{client.contactName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                <p className="text-sm" data-testid="text-email">{client.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Phone</p>
                <p className="text-sm" data-testid="text-phone">{client.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Website</p>
                <p className="text-sm" data-testid="text-website">{client.companyWebsite || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Address</p>
                <p className="text-sm" data-testid="text-address">{client.address || "—"}</p>
              </div>
              {client.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsProjectDialogOpen(true)} data-testid="button-new-project">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {projectsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No projects yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                        <TableCell className="font-medium" data-testid={`text-project-name-${project.id}`}>
                          {project.name}
                        </TableCell>
                        <TableCell data-testid={`text-scope-${project.id}`}>{project.scope}</TableCell>
                        <TableCell data-testid={`text-start-${project.id}`}>
                          {formatDate(project.startDate)}
                        </TableCell>
                        <TableCell data-testid={`text-end-${project.id}`}>
                          {formatDate(project.endDate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={project.status} type="project" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/invoices/new?clientId=${clientId}`}>
              <Button data-testid="button-create-invoice">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              {invoicesLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No invoices yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-mono text-sm" data-testid={`text-invoice-number-${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell data-testid={`text-project-${invoice.id}`}>
                          {invoice.projectName || "—"}
                        </TableCell>
                        <TableCell data-testid={`text-issue-${invoice.id}`}>
                          {formatDate(invoice.issueDate)}
                        </TableCell>
                        <TableCell data-testid={`text-due-${invoice.id}`}>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-total-${invoice.id}`}>
                          {formatCurrency(invoice.totalAmount)}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        client={client}
      />
      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        clientId={clientId!}
      />
    </div>
  );
}
