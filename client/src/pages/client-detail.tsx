import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
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
import { ArrowLeft, Edit, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { ClientDialog } from "@/components/client-dialog";
import { ProjectDialog } from "@/components/project-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Client, Project, InvoiceWithRelations } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const [, navigate] = useLocation();
  const clientId = params?.id;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      if (!clientId) return null;
      return apiRequest("GET", `/api/clients/${clientId}`);
    },
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
        description: "Client has been deleted successfully",
      });
      navigate("/clients");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully",
      });
      setDeletingProject(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const handleCloseProjectDialog = () => {
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-client-name">
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
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setIsDeleteDialogOpen(true)}
            data-testid="button-delete-client"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">
            Projects
            {projects && projects.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {projects.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            Invoices
            {invoices && invoices.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {invoices.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono" data-testid="metric-total-invoiced">
                  {formatCurrency(totalInvoiced)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-amber-600" data-testid="metric-outstanding">
                  {formatCurrency(totalOutstanding)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="metric-projects">
                  {projects?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Contact Person</p>
                <p className="text-sm font-medium" data-testid="text-contact-name">{client.contactName}</p>
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

          <Card className="border-0 shadow-sm">
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
                  <p className="text-sm mt-1">Create your first project to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider">Project Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Scope</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Start Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">End Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/30" data-testid={`row-project-${project.id}`}>
                        <TableCell className="font-medium" data-testid={`text-project-name-${project.id}`}>
                          {project.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-scope-${project.id}`}>
                          {project.scope}
                        </TableCell>
                        <TableCell data-testid={`text-start-${project.id}`}>
                          {formatDate(project.startDate)}
                        </TableCell>
                        <TableCell data-testid={`text-end-${project.id}`}>
                          {formatDate(project.endDate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={project.status} type="project" />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletingProject(project)}
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

          <Card className="border-0 shadow-sm">
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
                  <p className="text-sm mt-1">Create your first invoice to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider">Invoice #</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Project</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Issue Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Due Date</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider">Total</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider">Paid</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider">Balance</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id} 
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        data-testid={`row-invoice-${invoice.id}`}
                      >
                        <TableCell className="font-mono text-sm font-medium text-primary" data-testid={`text-invoice-number-${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-project-${invoice.id}`}>
                          {invoice.projectName || "—"}
                        </TableCell>
                        <TableCell data-testid={`text-issue-${invoice.id}`}>
                          {formatDate(invoice.issueDate)}
                        </TableCell>
                        <TableCell data-testid={`text-due-${invoice.id}`}>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm" data-testid={`text-total-${invoice.id}`}>
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-600" data-testid={`text-paid-${invoice.id}`}>
                          {formatCurrency(invoice.amountPaid)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium" data-testid={`text-balance-${invoice.id}`}>
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
        onOpenChange={handleCloseProjectDialog}
        clientId={clientId!}
        project={editingProject}
      />
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Client"
        itemName={client.name}
        isLoading={deleteMutation.isPending}
      />
      <DeleteConfirmDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        onConfirm={() => deletingProject && deleteProjectMutation.mutate(deletingProject.id)}
        title="Delete Project"
        itemName={deletingProject?.name}
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
}
