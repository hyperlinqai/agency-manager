import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Trash2, 
  MoreHorizontal,
  FileText,
  FileSignature,
  FolderOpen,
  Key,
  BarChart3,
  Building2,
  Palette,
  Globe,
  Share2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Link2,
  Copy,
  ExternalLink,
  RefreshCw,
  DollarSign,
  CalendarDays,
  Megaphone,
  Cog,
  Code,
  MessagesSquare,
  Database,
} from "lucide-react";
import { ClientDialog } from "@/components/client-dialog";
import { ProjectDialog } from "@/components/project-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { UploadReportDialog } from "@/components/upload-report-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { 
  Client, 
  Project, 
  InvoiceWithRelations, 
  ProposalWithRelations, 
  ContractWithRelations,
  ClientOnboardingData,
  MonthlyReportWithRelations,
  ClientDigitalAsset,
} from "@shared/schema";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
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
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);
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

  const { data: proposals } = useQuery<ProposalWithRelations[]>({
    queryKey: ["/api/proposals", { clientId }],
    enabled: !!clientId,
  });

  const { data: contracts } = useQuery<ContractWithRelations[]>({
    queryKey: ["/api/contracts", { clientId }],
    enabled: !!clientId,
  });

  const { data: onboardingData } = useQuery<ClientOnboardingData>({
    queryKey: ["/api/client-onboarding", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      return apiRequest("GET", `/api/clients/${clientId}/onboarding`);
    },
    enabled: !!clientId,
  });

  const { data: monthlyReports } = useQuery<MonthlyReportWithRelations[]>({
    queryKey: ["/api/monthly-reports", { clientId }],
    enabled: !!clientId,
  });

  const { data: digitalAssets } = useQuery<ClientDigitalAsset[]>({
    queryKey: ["/api/client-assets", { clientId }],
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

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest("DELETE", `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully",
      });
      setDeletingInvoice(null);
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
              <SelectItem value="ONBOARDING">Onboarding</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
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
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Building2 className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contracts" data-testid="tab-contracts">
            <FileSignature className="h-4 w-4 mr-1.5" />
            Contracts
            {contracts && contracts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {contracts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">
            <DollarSign className="h-4 w-4 mr-1.5" />
            Billing
            {invoices && invoices.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {invoices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="onboarding" data-testid="tab-onboarding">
            <Key className="h-4 w-4 mr-1.5" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">
            <Cog className="h-4 w-4 mr-1.5" />
            Services
            {projects && projects.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {projects.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">
            <FolderOpen className="h-4 w-4 mr-1.5" />
            Files
            {digitalAssets && digitalAssets.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {digitalAssets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Marketing Reports
            {monthlyReports && monthlyReports.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {monthlyReports.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="metric-projects">
                  {projects?.filter(p => p.status === "IN_PROGRESS").length || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Project Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-sm">
                  {(client as any).projectType?.replace("_", " ") || "Mixed"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
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
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Industry</p>
                  <p className="text-sm">{(client as any).industry || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Address</p>
                  <p className="text-sm" data-testid="text-address">{client.address || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contract & Retention */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Contract & Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Contract Start</p>
                    <p className="text-sm">{(client as any).contractStartDate ? formatDate((client as any).contractStartDate) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Contract End</p>
                    <p className="text-sm">{(client as any).contractEndDate ? formatDate((client as any).contractEndDate) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Next Review Date</p>
                    <p className="text-sm">{(client as any).nextReviewDate ? formatDate((client as any).nextReviewDate) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Onboarding Status</p>
                    <Badge variant={(client as any).onboardingCompleted ? "default" : "secondary"}>
                      {(client as any).onboardingCompleted ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                </div>
                {(client as any).retentionNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Retention Notes</p>
                    <p className="text-sm text-muted-foreground">{(client as any).retentionNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {client.notes && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
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

        <TabsContent value="billing" className="space-y-4">
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
                      <TableHead className="text-right text-xs uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id} 
                        className="hover:bg-muted/30"
                        data-testid={`row-invoice-${invoice.id}`}
                      >
                        <TableCell 
                          className="font-mono text-sm font-medium text-primary cursor-pointer hover:underline" 
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          data-testid={`text-invoice-number-${invoice.id}`}
                        >
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts & Proposals Tab */}
        <TabsContent value="contracts" className="space-y-6">
          {/* Proposals Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Proposals
              </h3>
              <Link href={`/proposals/new?clientId=${clientId}`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
              </Link>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {!proposals || proposals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No proposals yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Valid Until</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wider">Value</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals.map((proposal) => (
                        <TableRow 
                          key={proposal.id} 
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/proposals/${proposal.id}`)}
                        >
                          <TableCell className="font-medium">{proposal.title}</TableCell>
                          <TableCell>{formatDate(proposal.validUntil)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(proposal.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={proposal.status === "ACCEPTED" ? "default" : "secondary"}>
                              {proposal.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contracts Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                Contracts & Agreements
              </h3>
              <Link href={`/contracts/new?clientId=${clientId}`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Contract
                </Button>
              </Link>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {!contracts || contracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSignature className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No contracts yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wider">Contract #</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Start Date</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">End Date</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wider">Value</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow 
                          key={contract.id} 
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                        >
                          <TableCell className="font-mono text-sm font-medium text-primary">
                            {contract.contractNumber}
                          </TableCell>
                          <TableCell className="font-medium">{contract.title}</TableCell>
                          <TableCell>{formatDate(contract.startDate)}</TableCell>
                          <TableCell>{contract.endDate ? formatDate(contract.endDate) : "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(contract.contractValue)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>
                              {contract.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onboarding Tab - Client Onboarding Hub */}
        <TabsContent value="onboarding" className="space-y-6">
          {/* Shareable Onboarding Link */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Client Onboarding Link
              </CardTitle>
              <CardDescription>
                Share this link with your client to collect their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background rounded-lg border px-3 py-2 text-sm font-mono truncate">
                  {window.location.origin}/onboarding/{(client as any).onboardingToken || ""}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/onboarding/${(client as any).onboardingToken || ""}`);
                    toast({ title: "Link copied!", description: "Onboarding link copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`/onboarding/${(client as any).onboardingToken || ""}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={(client as any).onboardingCompleted ? "default" : "secondary"}>
                    {(client as any).onboardingCompleted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                {(client as any).onboardingCompletedAt && (
                  <span className="text-muted-foreground">
                    Submitted on {formatDate((client as any).onboardingCompletedAt)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Onboarding Progress</CardTitle>
              <CardDescription>Track collected items and information from the client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Completion</span>
                  <span className="font-medium">
                    {onboardingData?.overallStatus === "COMPLETED" ? "100%" : 
                     onboardingData?.overallStatus === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                  </span>
                </div>
                <Progress 
                  value={
                    onboardingData?.overallStatus === "COMPLETED" ? 100 :
                    onboardingData?.overallStatus === "IN_PROGRESS" ? 50 : 0
                  } 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Business Details & KYC */}
            <Card className={cn(
              "border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
              onboardingData?.businessDetails?.status === "COMPLETED" && "ring-2 ring-green-500/20"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Business Details & KYC
                  {onboardingData?.businessDetails?.status === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Legal name, GST, PAN, registration details
                </p>
                <Badge 
                  variant={onboardingData?.businessDetails?.status === "COMPLETED" ? "default" : "secondary"}
                  className="mt-3"
                >
                  {onboardingData?.businessDetails?.status || "NOT_STARTED"}
                </Badge>
              </CardContent>
            </Card>

            {/* Brand Assets */}
            <Card className={cn(
              "border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
              onboardingData?.brandAssets?.status === "COMPLETED" && "ring-2 ring-green-500/20"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Brand Assets
                  {onboardingData?.brandAssets?.status === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Logo, fonts, colors, brand guidelines
                </p>
                <Badge 
                  variant={onboardingData?.brandAssets?.status === "COMPLETED" ? "default" : "secondary"}
                  className="mt-3"
                >
                  {onboardingData?.brandAssets?.status || "NOT_STARTED"}
                </Badge>
              </CardContent>
            </Card>

            {/* Website Credentials */}
            <Card className={cn(
              "border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
              onboardingData?.websiteCredentials?.status === "COMPLETED" && "ring-2 ring-green-500/20"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Website & Hosting
                  {onboardingData?.websiteCredentials?.status === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Hosting, domain, CMS, FTP access
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    variant={onboardingData?.websiteCredentials?.status === "COMPLETED" ? "default" : "secondary"}
                  >
                    {onboardingData?.websiteCredentials?.status || "NOT_STARTED"}
                  </Badge>
                  {onboardingData?.websiteCredentials?.items && onboardingData.websiteCredentials.items.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({onboardingData.websiteCredentials.items.length} items)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social & Ad Accounts */}
            <Card className={cn(
              "border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
              onboardingData?.socialCredentials?.status === "COMPLETED" && "ring-2 ring-green-500/20"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  Social & Ad Accounts
                  {onboardingData?.socialCredentials?.status === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Social media, Google Ads, Meta Ads access
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    variant={onboardingData?.socialCredentials?.status === "COMPLETED" ? "default" : "secondary"}
                  >
                    {onboardingData?.socialCredentials?.status || "NOT_STARTED"}
                  </Badge>
                  {onboardingData?.socialCredentials?.items && onboardingData.socialCredentials.items.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({onboardingData.socialCredentials.items.length} accounts)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Previous Marketing Reports */}
            <Card className={cn(
              "border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
              onboardingData?.marketingReports?.status === "COMPLETED" && "ring-2 ring-green-500/20"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Previous Reports
                  {onboardingData?.marketingReports?.status === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Past marketing reports for benchmarking
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    variant={onboardingData?.marketingReports?.status === "COMPLETED" ? "default" : "secondary"}
                  >
                    {onboardingData?.marketingReports?.status || "NOT_STARTED"}
                  </Badge>
                  {onboardingData?.marketingReports?.items && onboardingData.marketingReports.items.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({onboardingData.marketingReports.items.length} files)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Due Reminders */}
          {invoices && invoices.filter(inv => inv.status !== "PAID" && new Date(inv.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length > 0 && (
            <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Invoice Due Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoices
                    .filter(inv => inv.status !== "PAID" && new Date(inv.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                    .map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">Due: {formatDate(inv.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-medium">{formatCurrency(inv.balanceDue)}</p>
                          <Badge variant="destructive" className="text-xs">
                            {new Date(inv.dueDate) < new Date() ? "OVERDUE" : "DUE SOON"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files & Assets Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Digital Assets</CardTitle>
                  <CardDescription>Logos, brand files, documents, and other assets</CardDescription>
                </div>
                <Button 
                  data-testid="button-upload-asset"
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "File upload functionality will be available soon. For now, you can add asset links in the Onboarding tab.",
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Asset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!digitalAssets || digitalAssets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No digital assets yet</p>
                  <p className="text-sm mt-1">Upload logos, brand files, and other assets</p>
                  <p className="text-xs mt-4">
                    Tip: Collect brand assets from clients using the <Link href={`/clients/${clientId}?tab=onboarding`} className="text-primary underline">Onboarding form</Link>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {digitalAssets.map((asset) => (
                    <Card key={asset.id} className="border hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                          {asset.category === "LOGO" ? (
                            <Palette className="h-8 w-8 text-muted-foreground" />
                          ) : asset.category === "IMAGE" ? (
                            <FolderOpen className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Reports Tab - Marketing Reports Upload */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Marketing Reports
                  </CardTitle>
                  <CardDescription>
                    Upload monthly marketing reports (PDF, DOC, PPT, Excel) for recurring marketing projects
                  </CardDescription>
                </div>
                <Button 
                  data-testid="button-upload-report"
                  onClick={() => setIsUploadReportOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!monthlyReports || monthlyReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-t">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No marketing reports uploaded yet</p>
                  <p className="text-sm mt-1">Upload monthly reports for recurring marketing projects</p>
                  <p className="text-xs mt-4 text-muted-foreground/70">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider">Report</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Period</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Uploaded</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReports.map((report) => (
                      <TableRow 
                        key={report.id} 
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/monthly-reports/${report.id}`)}
                      >
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{report.reportMonth}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {report.attachments && report.attachments.length > 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {report.attachments[0]?.type || "PDF"}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(report.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.status === "SENT" ? "default" : "secondary"}>
                            {report.status}
                          </Badge>
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
      <DeleteConfirmDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
        onConfirm={() => deletingInvoice && deleteInvoiceMutation.mutate(deletingInvoice.id)}
        title="Delete Invoice"
        itemName={deletingInvoice?.invoiceNumber}
        description={`Are you sure you want to delete invoice "${deletingInvoice?.invoiceNumber}"? This will also delete all associated payments and line items. This action cannot be undone.`}
        isLoading={deleteInvoiceMutation.isPending}
      />
      
      {client && clientId && (
        <UploadReportDialog
          open={isUploadReportOpen}
          onOpenChange={setIsUploadReportOpen}
          clientId={clientId}
          clientName={client.name}
        />
      )}
    </div>
  );
}
