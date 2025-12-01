import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Building2,
  Save,
  Briefcase,
  Download,
  Trash2,
  Package,
  Tags,
  Settings2,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Sparkles,
  CalendarOff,
  Mail,
  MessageSquare,
  Hash,
  Shield,
  Users,
  RefreshCw,
  Clock,
  CreditCard,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ServiceDialog } from "@/components/service-dialog";
import { JobRoleDialog } from "@/components/job-role-dialog";
import { ExpenseCategoryDialog } from "@/components/expense-category-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import type { Service, CompanyProfile, JobRole, ExpenseCategory, LeaveType, LeavePolicyWithDetails, SlackSettings, PaymentGatewaySettings } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanyProfileSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TwoFactorAuth } from "@/components/two-factor-auth";
import { z } from "zod";

export default function SettingsPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);
  const [isJobRoleDialogOpen, setIsJobRoleDialogOpen] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<ExpenseCategory | null>(null);
  const [isExpenseCategoryDialogOpen, setIsExpenseCategoryDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deletingJobRole, setDeletingJobRole] = useState<JobRole | null>(null);
  const [deletingExpenseCategory, setDeletingExpenseCategory] = useState<ExpenseCategory | null>(null);

  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: jobRolesData, isLoading: isLoadingJobRoles } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });

  // Ensure jobRoles is always an array
  const jobRoles = Array.isArray(jobRolesData) ? jobRolesData : [];

  const { data: expenseCategories = [], isLoading: isLoadingExpenseCategories } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
  });

  const { toast } = useToast();

  // Service mutations
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service deleted successfully" });
      setDeletingService(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Job Role mutations
  const deleteJobRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/job-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      toast({ title: "Success", description: "Job role deleted successfully" });
      setDeletingJobRole(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const seedJobRolesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/job-roles/seed-defaults");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      toast({ title: "Success", description: `Job roles loaded. Total: ${data.count} roles` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Expense Category mutations
  const deleteExpenseCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expense-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
      setDeletingExpenseCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const seedExpenseCategoriesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/expense-categories/seed-defaults");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      toast({ title: "Success", description: `Categories loaded. Total: ${data.count} categories` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Service handlers
  const handleNewService = () => {
    setSelectedService(null);
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsServiceDialogOpen(true);
  };

  // Job Role handlers
  const handleNewJobRole = () => {
    setSelectedJobRole(null);
    setIsJobRoleDialogOpen(true);
  };

  const handleEditJobRole = (role: JobRole) => {
    setSelectedJobRole(role);
    setIsJobRoleDialogOpen(true);
  };

  // Expense Category handlers
  const handleNewExpenseCategory = () => {
    setSelectedExpenseCategory(null);
    setIsExpenseCategoryDialogOpen(true);
  };

  const handleEditExpenseCategory = (category: ExpenseCategory) => {
    setSelectedExpenseCategory(category);
    setIsExpenseCategoryDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SEO: "SEO",
      SOCIAL_MEDIA: "Social Media",
      CONTENT: "Content",
      ADVERTISING: "Advertising",
      DESIGN: "Design",
      DEVELOPMENT: "Development",
      CONSULTING: "Consulting",
      OTHER: "Other",
    };
    return labels[category] || category;
  };

  // Group expense categories by group
  const groupedExpenseCategories = expenseCategories.reduce((acc, cat) => {
    const group = (cat as any).group || "Uncategorized";
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, ExpenseCategory[]>);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:inline-flex">
          <TabsTrigger value="services" className="gap-2" data-testid="tab-services">
            <Package className="h-4 w-4 hidden sm:inline" />
            Services
          </TabsTrigger>
          <TabsTrigger value="expense-categories" className="gap-2" data-testid="tab-expense-categories">
            <Tags className="h-4 w-4 hidden sm:inline" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="job-roles" className="gap-2" data-testid="tab-job-roles">
            <Briefcase className="h-4 w-4 hidden sm:inline" />
            Job Roles
          </TabsTrigger>
          <TabsTrigger value="leave-policies" className="gap-2" data-testid="tab-leave-policies">
            <CalendarOff className="h-4 w-4 hidden sm:inline" />
            Leave Policies
          </TabsTrigger>
          <TabsTrigger value="slack" className="gap-2" data-testid="tab-slack">
            <MessageSquare className="h-4 w-4 hidden sm:inline" />
            Slack
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2" data-testid="tab-integrations">
            <CreditCard className="h-4 w-4 hidden sm:inline" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2" data-testid="tab-api-keys">
            <Key className="h-4 w-4 hidden sm:inline" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
            <Shield className="h-4 w-4 hidden sm:inline" />
            Security
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2" data-testid="tab-company">
            <Building2 className="h-4 w-4 hidden sm:inline" />
            Company
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Service Catalog</CardTitle>
                  <CardDescription>Manage your agency's service offerings</CardDescription>
                </div>
                <Button onClick={handleNewService} data-testid="button-new-service">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingServices ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : services && services.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6 text-xs uppercase tracking-wider">Name</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Category</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-wider">Price</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Unit</TableHead>
                        <TableHead className="pr-6 text-right text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id} className="hover:bg-muted/30" data-testid={`row-service-${service.id}`}>
                          <TableCell className="pl-6 font-medium">{service.name}</TableCell>
                          <TableCell className="text-muted-foreground">{getCategoryLabel(service.category)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={service.status === "ACTIVE" 
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400" 
                                : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400"}
                            >
                              {service.status === "ACTIVE" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(service.defaultPrice)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{service.unit}</TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditService(service)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingService(service)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No services found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Create your first service to get started</p>
                  <Button onClick={handleNewService}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Categories Tab */}
        <TabsContent value="expense-categories" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Expense Categories</CardTitle>
                  <CardDescription>Organize your expenses with custom categories</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => seedExpenseCategoriesMutation.mutate()}
                    disabled={seedExpenseCategoriesMutation.isPending}
                    data-testid="button-load-default-categories"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {seedExpenseCategoriesMutation.isPending ? "Loading..." : "Load Defaults"}
                  </Button>
                  <Button onClick={handleNewExpenseCategory} data-testid="button-new-expense-category">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExpenseCategories ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : expenseCategories.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedExpenseCategories).map(([group, categories]) => (
                    <div key={group}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {group}
                        <span className="text-xs font-normal normal-case">({categories.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.map((category) => (
                          <div 
                            key={category.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {category.code}
                                </Badge>
                              </div>
                              <span className="text-sm font-medium truncate">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditExpenseCategory(category)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingExpenseCategory(category)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tags className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No expense categories found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                    Click "Load Defaults" to add standard agency expense categories
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => seedExpenseCategoriesMutation.mutate()}>
                      <Download className="h-4 w-4 mr-2" />
                      Load Defaults
                    </Button>
                    <Button onClick={handleNewExpenseCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Roles Tab */}
        <TabsContent value="job-roles" className="space-y-4 mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Job Roles</CardTitle>
                  <CardDescription>Define job roles for team members</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => seedJobRolesMutation.mutate()}
                    disabled={seedJobRolesMutation.isPending}
                    data-testid="button-load-default-roles"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {seedJobRolesMutation.isPending ? "Loading..." : "Load Defaults"}
                  </Button>
                  <Button onClick={handleNewJobRole} data-testid="button-new-job-role">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingJobRoles ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : jobRoles && jobRoles.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6 text-xs uppercase tracking-wider">Title</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="pr-6 text-right text-xs uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobRoles.map((role) => (
                        <TableRow key={role.id} className="hover:bg-muted/30" data-testid={`row-job-role-${role.id}`}>
                          <TableCell className="pl-6 font-medium">{role.title}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{role.description || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={role.status === "ACTIVE" 
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400" 
                                : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400"}
                            >
                              {role.status === "ACTIVE" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditJobRole(role)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingJobRole(role)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No job roles found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                    Click "Load Defaults" to add common marketing agency roles
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => seedJobRolesMutation.mutate()}>
                      <Download className="h-4 w-4 mr-2" />
                      Load Defaults
                    </Button>
                    <Button onClick={handleNewJobRole}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Policies Tab */}
        <TabsContent value="leave-policies" className="space-y-4 mt-6">
          <LeavePoliciesSettings jobRoles={jobRoles} />
        </TabsContent>

        {/* Slack Integration Tab */}
        <TabsContent value="slack" className="space-y-4 mt-6">
          <SlackIntegrationSettings />
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4 mt-6">
          <APIKeysSettings />
        </TabsContent>

        {/* Payment Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4 mt-6">
          <PaymentIntegrationsSettings />
        </TabsContent>

        {/* Company Tab */}
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <TwoFactorAuth />
        </TabsContent>

        <TabsContent value="company" className="space-y-4 mt-6">
          <CompanySettingsForm />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ServiceDialog
        service={selectedService}
        open={isServiceDialogOpen}
        onClose={() => { setIsServiceDialogOpen(false); setSelectedService(null); }}
      />

      <JobRoleDialog
        role={selectedJobRole}
        open={isJobRoleDialogOpen}
        onClose={() => { setIsJobRoleDialogOpen(false); setSelectedJobRole(null); }}
      />

      <ExpenseCategoryDialog
        category={selectedExpenseCategory}
        open={isExpenseCategoryDialogOpen}
        onClose={() => { setIsExpenseCategoryDialogOpen(false); setSelectedExpenseCategory(null); }}
      />

      {/* Delete Confirmations */}
      <DeleteConfirmDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
        onConfirm={() => deletingService && deleteServiceMutation.mutate(deletingService.id)}
        title="Delete Service"
        itemName={deletingService?.name}
        isLoading={deleteServiceMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletingJobRole}
        onOpenChange={(open) => !open && setDeletingJobRole(null)}
        onConfirm={() => deletingJobRole && deleteJobRoleMutation.mutate(deletingJobRole.id)}
        title="Delete Job Role"
        itemName={deletingJobRole?.title}
        isLoading={deleteJobRoleMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletingExpenseCategory}
        onOpenChange={(open) => !open && setDeletingExpenseCategory(null)}
        onConfirm={() => deletingExpenseCategory && deleteExpenseCategoryMutation.mutate(deletingExpenseCategory.id)}
        title="Delete Expense Category"
        itemName={deletingExpenseCategory?.name}
        isLoading={deleteExpenseCategoryMutation.isPending}
      />
    </div>
  );
}

function CompanySettingsForm() {
  const { toast } = useToast();
  const { data: companyProfile, isLoading } = useQuery<CompanyProfile | null>({
    queryKey: ["/api/settings/company"],
  });

  const MAX_LOGO_FILE_SIZE = 1024 * 1024; // 1MB

  const form = useForm<z.infer<typeof insertCompanyProfileSchema>>({
    resolver: zodResolver(insertCompanyProfileSchema),
    defaultValues: {
      companyName: "",
      logoUrl: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      taxId: "",
      bankName: "",
      bankAccountNumber: "",
      bankIfscCode: "",
      bankAccountHolderName: "",
      upiId: "",
      paymentLink: "",
      paymentGatewayDetails: "",
      invoiceTerms: "",
      paymentNotes: "",
      authorizedSignatoryName: "",
      authorizedSignatoryTitle: "",
    },
    values: companyProfile || undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCompanyProfileSchema>) => {
      if (!companyProfile?.id) {
        return await apiRequest("POST", "/api/settings/company", data);
      }
      return await apiRequest("PUT", `/api/settings/company/${companyProfile.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({
        title: "Success",
        description: "Company profile updated successfully",
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

  const onSubmit = (data: z.infer<typeof insertCompanyProfileSchema>) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Company Information</CardTitle>
            <CardDescription>
              Update your company details for invoices and official documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Brand Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          {field.value ? (
                            <img
                              src={field.value}
                              alt="Logo preview"
                              className="h-16 w-16 rounded-lg border object-cover bg-muted"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg border flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                              No logo
                            </div>
                          )}
                          {field.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange("")}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              if (file.size > MAX_LOGO_FILE_SIZE) {
                                toast({
                                  title: "Logo too large",
                                  description: "Please upload an image under 1MB.",
                                  variant: "destructive",
                                });
                                event.target.value = "";
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  field.onChange(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                              event.target.value = "";
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload a PNG, JPG, or SVG (max 1MB). This logo will appear on invoices.
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Acme Corporation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="contact@company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 234 567 8900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Suite 100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="New York" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NY" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="10001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="India" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tax ID / GST Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="GST1234567890" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Banking Details</CardTitle>
            <CardDescription>Bank account information for invoice payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="HDFC Bank" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="50200012345678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankIfscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC / Swift Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="HDFC0001234" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountHolderName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe / Company Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">UPI & Online Payment</CardTitle>
            <CardDescription>UPI ID and payment links for quick payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="yourname@upi" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">QR code auto-generated on invoices</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Link (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://razorpay.me/yourcompany" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentGatewayDetails"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Additional Payment Instructions</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Optional payment gateway information" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Invoice Settings</CardTitle>
            <CardDescription>Default terms and notes for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="invoiceTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Payment terms, late fees, etc." rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Thank you notes" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Authorized Signatory</CardTitle>
            <CardDescription>Person authorized to sign invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authorizedSignatoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="authorizedSignatoryTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Proprietor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Leave Policies Settings Component
function LeavePoliciesSettings({ jobRoles }: { jobRoles: JobRole[] }) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicyWithDetails | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<LeavePolicyWithDetails | null>(null);
  const [formData, setFormData] = useState({
    jobRoleId: "",
    leaveTypeId: "",
    annualQuota: 12,
    carryForwardLimit: 0,
    isActive: true,
  });

  const { data: leaveTypesData, isLoading: loadingTypes } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave-types"],
  });

  const { data: leavePoliciesData, isLoading: loadingPolicies } = useQuery<LeavePolicyWithDetails[]>({
    queryKey: ["/api/leave-policies"],
  });

  // Ensure arrays are always valid
  const leaveTypes = Array.isArray(leaveTypesData) ? leaveTypesData : [];
  const leavePolicies = Array.isArray(leavePoliciesData) ? leavePoliciesData : [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/leave-policies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies"] });
      toast({ title: "Success", description: "Leave policy created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PUT", `/api/leave-policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies"] });
      toast({ title: "Success", description: "Leave policy updated successfully" });
      setShowAddDialog(false);
      setEditingPolicy(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/leave-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies"] });
      toast({ title: "Success", description: "Leave policy deleted successfully" });
      setDeletingPolicy(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const seedTypesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/leave-types/seed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-types"] });
      toast({ title: "Success", description: "Default leave types created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const seedPoliciesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/leave-policies/seed");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies"] });
      toast({
        title: "Success",
        description: `Created ${data.created} policies${data.skipped > 0 ? `, ${data.skipped} already existed` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      jobRoleId: "",
      leaveTypeId: "",
      annualQuota: 12,
      carryForwardLimit: 0,
      isActive: true,
    });
  };

  const handleEdit = (policy: LeavePolicyWithDetails) => {
    setEditingPolicy(policy);
    setFormData({
      jobRoleId: policy.jobRoleId,
      leaveTypeId: policy.leaveTypeId,
      annualQuota: policy.annualQuota,
      carryForwardLimit: policy.carryForwardLimit,
      isActive: policy.isActive,
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = loadingTypes || loadingPolicies;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Leave Policies</CardTitle>
              <CardDescription>
                Configure annual leave quotas for each job role and leave type
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {leaveTypes.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => seedTypesMutation.mutate()}
                  disabled={seedTypesMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Default Leave Types
                </Button>
              )}
              {leaveTypes.length > 0 && jobRoles.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => seedPoliciesMutation.mutate()}
                  disabled={seedPoliciesMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {seedPoliciesMutation.isPending ? "Creating..." : "Create Default Policies"}
                </Button>
              )}
              <Button onClick={() => { resetForm(); setEditingPolicy(null); setShowAddDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave types configured yet.</p>
              <p className="text-sm mt-1">Click "Create Default Leave Types" to get started.</p>
            </div>
          ) : leavePolicies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave policies configured yet.</p>
              {jobRoles.length > 0 ? (
                <p className="text-sm mt-1">Click "Create Default Policies" to auto-generate policies for all job roles.</p>
              ) : (
                <p className="text-sm mt-1">First create Job Roles, then add policies to define leave quotas.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 text-xs uppercase tracking-wider">Job Role</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Leave Type</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Annual Quota</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider">Carry Forward Limit</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="pr-6 text-right text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leavePolicies.map((policy) => (
                    <TableRow key={policy.id} className="hover:bg-muted/30">
                      <TableCell className="pl-6 font-medium">{policy.jobRoleTitle || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.leaveTypeCode}</Badge>
                        <span className="ml-2 text-muted-foreground">{policy.leaveTypeName}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{policy.annualQuota} days</TableCell>
                      <TableCell className="text-right">{policy.carryForwardLimit} days</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={policy.isActive
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400"
                            : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400"}
                        >
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(policy)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingPolicy(policy)}
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
        </CardContent>
      </Card>

      {/* Leave Types Reference Card */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium mb-3">Available Leave Types</h4>
          {leaveTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave types available. Create default types first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {leaveTypes.map((type) => (
                <Badge key={type.id} variant="secondary">
                  {type.code} - {type.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setEditingPolicy(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Job Role</label>
              <Select
                value={formData.jobRoleId}
                onValueChange={(v) => setFormData({ ...formData, jobRoleId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Leave Type</label>
              <Select
                value={formData.leaveTypeId}
                onValueChange={(v) => setFormData({ ...formData, leaveTypeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Annual Quota (days)</label>
              <Input
                type="number"
                min="0"
                value={formData.annualQuota}
                onChange={(e) => setFormData({ ...formData, annualQuota: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Carry Forward Limit (days)</label>
              <Input
                type="number"
                min="0"
                value={formData.carryForwardLimit}
                onChange={(e) => setFormData({ ...formData, carryForwardLimit: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum days that can be carried to next year</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingPolicy(null); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.jobRoleId || !formData.leaveTypeId || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingPolicy}
        onOpenChange={(open) => !open && setDeletingPolicy(null)}
        onConfirm={() => deletingPolicy && deleteMutation.mutate(deletingPolicy.id)}
        title="Delete Leave Policy"
        description={`Are you sure you want to delete the leave policy for ${deletingPolicy?.jobRoleTitle} - ${deletingPolicy?.leaveTypeName}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

interface ApiKeysData {
  openaiApiKey: string;
  geminiApiKey: string;
  resendApiKey: string;
  senderEmail: string;
  senderName: string;
  hasOpenaiKey: boolean;
  hasGeminiKey: boolean;
  hasResendKey: boolean;
}

function APIKeysSettings() {
  const { toast } = useToast();
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingResend, setTestingResend] = useState(false);
  const [openaiConnected, setOpenaiConnected] = useState(false);
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [resendConnected, setResendConnected] = useState(false);

  // Track if user wants to add/change a key (show input field)
  const [isAddingOpenAI, setIsAddingOpenAI] = useState(false);
  const [isAddingGemini, setIsAddingGemini] = useState(false);
  const [isAddingResend, setIsAddingResend] = useState(false);

  // Sender email configuration
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [savingSenderConfig, setSavingSenderConfig] = useState(false);

  // Fetch API keys from database
  const { data: apiKeysData, isLoading } = useQuery<ApiKeysData>({
    queryKey: ["/api/settings/api-keys"],
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (apiKeysData) {
      // Only set the key value if we're NOT in adding mode
      // This prevents overwriting user's input when refetching
      if (!isAddingOpenAI) {
        setOpenaiKey(apiKeysData.hasOpenaiKey ? apiKeysData.openaiApiKey : "");
      }
      if (!isAddingGemini) {
        setGeminiKey(apiKeysData.hasGeminiKey ? apiKeysData.geminiApiKey : "");
      }
      if (!isAddingResend) {
        setResendKey(apiKeysData.hasResendKey ? apiKeysData.resendApiKey : "");
      }
      // Mark as connected if key exists in database
      setOpenaiConnected(apiKeysData.hasOpenaiKey);
      setGeminiConnected(apiKeysData.hasGeminiKey);
      setResendConnected(apiKeysData.hasResendKey);
      // Set sender email configuration
      setSenderEmail(apiKeysData.senderEmail || "");
      setSenderName(apiKeysData.senderName || "");
    }
  }, [apiKeysData, isAddingOpenAI, isAddingGemini, isAddingResend]);

  const saveMutation = useMutation({
    mutationFn: async (data: { openaiApiKey?: string; geminiApiKey?: string; resendApiKey?: string }) => {
      return apiRequest("PUT", "/api/settings/api-keys", data);
    },
    onSuccess: (response: ApiKeysData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/api-keys"] });
      // Update connected status
      if (response.hasOpenaiKey) {
        setOpenaiConnected(true);
        setIsAddingOpenAI(false);
      }
      if (response.hasGeminiKey) {
        setGeminiConnected(true);
        setIsAddingGemini(false);
      }
      if (response.hasResendKey) {
        setResendConnected(true);
        setIsAddingResend(false);
      }
      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved securely.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save API keys",
        variant: "destructive",
      });
    },
  });

  // Connect and save OpenAI key
  const connectOpenAI = async () => {
    const keyToTest = openaiKey;
    if (!keyToTest || keyToTest.includes("*")) {
      toast({
        title: "Cannot Connect",
        description: "Please enter a valid OpenAI API key.",
        variant: "destructive",
      });
      return;
    }
    setTestingOpenAI(true);
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${keyToTest}`,
        },
      });
      if (response.ok) {
        // Save the key after successful connection
        saveMutation.mutate({ openaiApiKey: keyToTest });
        toast({
          title: "Connected Successfully",
          description: "OpenAI API key is valid and has been saved.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Invalid API Key",
          description: error.error?.message || "Failed to connect to OpenAI",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Could not connect to OpenAI API",
        variant: "destructive",
      });
    } finally {
      setTestingOpenAI(false);
    }
  };

  // Connect and save Gemini key
  const connectGemini = async () => {
    const keyToTest = geminiKey;
    if (!keyToTest || keyToTest.includes("*")) {
      toast({
        title: "Cannot Connect",
        description: "Please enter a valid Google Gemini API key.",
        variant: "destructive",
      });
      return;
    }
    setTestingGemini(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${keyToTest}`
      );
      if (response.ok) {
        // Save the key after successful connection
        saveMutation.mutate({ geminiApiKey: keyToTest });
        toast({
          title: "Connected Successfully",
          description: "Google Gemini API key is valid and has been saved.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Invalid API Key",
          description: error.error?.message || "Failed to connect to Gemini",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Could not connect to Google Gemini API",
        variant: "destructive",
      });
    } finally {
      setTestingGemini(false);
    }
  };

  // Connect and save Resend key
  const connectResend = async () => {
    const keyToTest = resendKey;
    if (!keyToTest || keyToTest.includes("*")) {
      toast({
        title: "Cannot Connect",
        description: "Please enter a valid Resend API key.",
        variant: "destructive",
      });
      return;
    }
    setTestingResend(true);
    try {
      // Test the Resend API key by configuring it
      const response = await apiRequest("POST", "/api/email/configure", { apiKey: keyToTest });
      if (response.success) {
        // Save the key after successful configuration
        saveMutation.mutate({ resendApiKey: keyToTest });
        toast({
          title: "Connected Successfully",
          description: "Resend API key is valid and has been saved.",
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: "Failed to configure Resend API",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Could not connect to Resend API",
        variant: "destructive",
      });
    } finally {
      setTestingResend(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Integration
          </CardTitle>
          <CardDescription>
            Configure API keys for AI-powered features like proposal and contract generation.
            Keys are stored securely in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI Configuration */}
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">OpenAI</h3>
                  <p className="text-sm text-muted-foreground">GPT-4 powered generation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {openaiConnected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not connected
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>

              {/* Show masked key when connected and not in edit mode */}
              {openaiConnected && !isAddingOpenAI ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm text-muted-foreground h-9 flex items-center">
                    {openaiKey}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingOpenAI(true);
                      setOpenaiKey("");
                    }}
                  >
                    Change Key
                  </Button>
                </div>
              ) : (
                /* Show input field when not connected or in edit mode */
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showOpenAIKey ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    >
                      {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {isAddingOpenAI && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingOpenAI(false);
                        setOpenaiKey(apiKeysData?.openaiApiKey || "");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={connectOpenAI}
                    disabled={testingOpenAI || !openaiKey || openaiKey.includes("*")}
                  >
                    {testingOpenAI ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  platform.openai.com
                </a>
              </p>
            </div>
          </div>

          {/* Google Gemini Configuration */}
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center">
                  <svg className="h-7 w-7" viewBox="0 0 28 28" fill="none">
                    <defs>
                      <linearGradient id="gemini-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1a73e8" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <path d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z" fill="url(#gemini-gradient)" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Google Gemini</h3>
                  <p className="text-sm text-muted-foreground">Gemini Pro powered generation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {geminiConnected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not connected
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>

              {/* Show masked key when connected and not in edit mode */}
              {geminiConnected && !isAddingGemini ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm text-muted-foreground h-9 flex items-center">
                    {geminiKey}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingGemini(true);
                      setGeminiKey("");
                    }}
                  >
                    Change Key
                  </Button>
                </div>
              ) : (
                /* Show input field when not connected or in edit mode */
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showGeminiKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {isAddingGemini && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingGemini(false);
                        setGeminiKey(apiKeysData?.geminiApiKey || "");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={connectGemini}
                    disabled={testingGemini || !geminiKey || geminiKey.includes("*")}
                  >
                    {testingGemini ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Integration Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Integration
          </CardTitle>
          <CardDescription>
            Configure Resend API for sending proposals, invoices, and contracts via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resend Configuration */}
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Resend</h3>
                  <p className="text-sm text-muted-foreground">Email delivery service</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {resendConnected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not connected
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>

              {/* Show masked key when connected and not in edit mode */}
              {resendConnected && !isAddingResend ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm text-muted-foreground h-9 flex items-center">
                    {resendKey}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingResend(true);
                      setResendKey("");
                    }}
                  >
                    Change Key
                  </Button>
                </div>
              ) : (
                /* Show input field when not connected or in edit mode */
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showResendKey ? "text" : "password"}
                      value={resendKey}
                      onChange={(e) => setResendKey(e.target.value)}
                      placeholder="re_..."
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowResendKey(!showResendKey)}
                    >
                      {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {isAddingResend && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingResend(false);
                        setResendKey(apiKeysData?.resendApiKey || "");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={connectResend}
                    disabled={testingResend || !resendKey || resendKey.includes("*")}
                  >
                    {testingResend ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  resend.com
                </a>
              </p>
            </div>

            {/* Sender Email Configuration */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <div>
                <h4 className="font-medium text-sm">Sender Configuration</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure the "From" address for all outgoing emails. Must be a verified domain in Resend.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sender Name</label>
                  <Input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your Company Name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Display name shown in recipient's inbox
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sender Email</label>
                  <Input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="hello@yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must use a verified domain in Resend
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setSavingSenderConfig(true);
                  try {
                    await apiRequest("PUT", "/api/settings/api-keys", {
                      senderEmail,
                      senderName,
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/settings/api-keys"] });
                    toast({
                      title: "Sender Configuration Saved",
                      description: "Your email sender settings have been updated.",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to save sender configuration",
                      variant: "destructive",
                    });
                  } finally {
                    setSavingSenderConfig(false);
                  }
                }}
                disabled={savingSenderConfig}
              >
                {savingSenderConfig ? "Saving..." : "Save Sender Settings"}
              </Button>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> If left empty, emails will be sent from{" "}
                  <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">onboarding@resend.dev</code> (Resend's test domain).
                  For production, verify your domain at{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    resend.com/domains
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Security Note</h4>
              <p className="text-sm text-muted-foreground">
                API keys are stored securely in the database and masked for display.
                When updating, enter the new key to replace the existing one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Slack Integration Settings Component
interface SlackChannel {
  id: string;
  name: string;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    display_name?: string;
  };
}

function SlackIntegrationSettings() {
  const { toast } = useToast();
  const [showBotToken, setShowBotToken] = useState(false);
  const [showSigningSecret, setShowSigningSecret] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const [formData, setFormData] = useState({
    botToken: "",
    signingSecret: "",
    checkInChannelId: "",
    checkInKeywords: ["good morning", "gm", "starting work", "today's tasks", "morning update", "morning todos"],
    checkOutKeywords: ["signing off", "done for the day", "wrapping up", "eod", "end of day", "logging off", "good night"],
    isActive: true,
  });

  // Fetch existing Slack settings
  const { data: slackSettings, isLoading, refetch } = useQuery<SlackSettings | null>({
    queryKey: ["/api/slack/settings"],
  });

  // Fetch Slack channels
  const { data: channels = [], isLoading: loadingChannels } = useQuery<SlackChannel[]>({
    queryKey: ["/api/slack/channels"],
    enabled: !!slackSettings?.botToken,
  });

  // Update form when settings are fetched
  useEffect(() => {
    if (slackSettings && !isConfiguring) {
      setFormData({
        botToken: slackSettings.botToken || "",
        signingSecret: slackSettings.signingSecret || "",
        checkInChannelId: slackSettings.checkInChannelId || "",
        checkInKeywords: slackSettings.checkInKeywords || [],
        checkOutKeywords: slackSettings.checkOutKeywords || [],
        isActive: slackSettings.isActive ?? true,
      });
    }
  }, [slackSettings, isConfiguring]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/slack/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slack/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slack/channels"] });
      toast({
        title: "Slack Connected",
        description: "Slack integration has been configured successfully.",
      });
      setIsConfiguring(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Slack settings",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      return apiRequest("PUT", `/api/slack/settings/${slackSettings?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slack/settings"] });
      toast({
        title: "Settings Updated",
        description: "Slack settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/slack/settings");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slack/settings"] });
      setFormData({
        botToken: "",
        signingSecret: "",
        checkInChannelId: "",
        checkInKeywords: ["good morning", "gm", "starting work", "today's tasks", "morning update", "morning todos"],
        checkOutKeywords: ["signing off", "done for the day", "wrapping up", "eod", "end of day", "logging off", "good night"],
        isActive: true,
      });
      toast({
        title: "Disconnected",
        description: "Slack integration has been removed.",
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

  const testConnection = async () => {
    if (!formData.botToken) {
      toast({
        title: "Missing Token",
        description: "Please enter a bot token first.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    try {
      const result = await apiRequest("POST", "/api/slack/test-connection", {
        botToken: formData.botToken,
      });
      if (result.ok) {
        toast({
          title: "Connection Successful",
          description: `Connected to workspace: ${result.teamName}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Could not connect to Slack",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (!formData.botToken || !formData.signingSecret) {
      toast({
        title: "Missing Required Fields",
        description: "Bot token and signing secret are required.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleKeywordChange = (type: "checkIn" | "checkOut", value: string) => {
    const keywords = value.split(",").map(k => k.trim()).filter(k => k);
    if (type === "checkIn") {
      setFormData({ ...formData, checkInKeywords: keywords });
    } else {
      setFormData({ ...formData, checkOutKeywords: keywords });
    }
  };

  const isConnected = !!slackSettings?.teamId;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.52-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 0 1 2.521 2.52A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.521-2.522v-2.52h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Slack Integration</CardTitle>
                <CardDescription>
                  Track attendance through Slack messages
                </CardDescription>
              </div>
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected to {slackSettings?.teamName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected || isConfiguring ? (
            <>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">Setup Instructions</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">api.slack.com/apps</a> and create a new app</li>
                  <li>Enable "Event Subscriptions" and set the Request URL to: <code className="bg-muted px-1 py-0.5 rounded text-xs">{window.location.origin}/api/slack/webhook</code></li>
                  <li>Subscribe to these bot events: <code className="bg-muted px-1 py-0.5 rounded text-xs">message.channels</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">message.groups</code></li>
                  <li>In "OAuth & Permissions", add scopes: <code className="bg-muted px-1 py-0.5 rounded text-xs">channels:history</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">chat:write</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">reactions:write</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">users:read</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">channels:read</code></li>
                  <li>Install the app to your workspace and copy the Bot Token and Signing Secret</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bot Token</label>
                  <div className="relative">
                    <Input
                      type={showBotToken ? "text" : "password"}
                      value={formData.botToken}
                      onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                      placeholder="xoxb-..."
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowBotToken(!showBotToken)}
                    >
                      {showBotToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Signing Secret</label>
                  <div className="relative">
                    <Input
                      type={showSigningSecret ? "text" : "password"}
                      value={formData.signingSecret}
                      onChange={(e) => setFormData({ ...formData, signingSecret: e.target.value })}
                      placeholder="Enter signing secret..."
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowSigningSecret(!showSigningSecret)}
                    >
                      {showSigningSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={testingConnection || !formData.botToken}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${testingConnection ? "animate-spin" : ""}`} />
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !formData.botToken || !formData.signingSecret}
                  >
                    {saveMutation.isPending ? "Connecting..." : "Connect Slack"}
                  </Button>
                  {isConfiguring && (
                    <Button variant="ghost" onClick={() => setIsConfiguring(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Attendance Channel
                  </label>
                  <Select
                    value={formData.checkInChannelId}
                    onValueChange={(v) => {
                      setFormData({ ...formData, checkInChannelId: v });
                      updateMutation.mutate({ checkInChannelId: v });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingChannels ? "Loading channels..." : "Select channel"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Channels</SelectItem>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          #{channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Monitor specific channel for attendance, or leave empty for all channels
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Integration Status
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{formData.isActive ? "Active" : "Paused"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formData.isActive ? "Messages are being monitored" : "Monitoring is paused"}
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, isActive: checked });
                        updateMutation.mutate({ isActive: checked });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check-In Keywords</label>
                  <Input
                    value={formData.checkInKeywords.join(", ")}
                    onChange={(e) => handleKeywordChange("checkIn", e.target.value)}
                    onBlur={() => updateMutation.mutate({ checkInKeywords: formData.checkInKeywords })}
                    placeholder="good morning, gm, starting work..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords that trigger check-in
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Check-Out Keywords</label>
                  <Input
                    value={formData.checkOutKeywords.join(", ")}
                    onChange={(e) => handleKeywordChange("checkOut", e.target.value)}
                    onBlur={() => updateMutation.mutate({ checkOutKeywords: formData.checkOutKeywords })}
                    placeholder="signing off, eod, wrapping up..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords that trigger check-out
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsConfiguring(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Update Credentials
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Team Member Mapping</h4>
              <p className="text-sm text-muted-foreground">
                To track attendance, link each team member's Slack account in the Team Management section.
                Go to Team → Edit Member → Connect Slack Account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payment Integrations Settings Component
function PaymentIntegrationsSettings() {
  const { toast } = useToast();
  const [activeGateway, setActiveGateway] = useState<"NONE" | "STRIPE" | "RAZORPAY">("NONE");
  const [isTestMode, setIsTestMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Stripe fields
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // Razorpay fields
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);

  // Fetch existing settings
  const { data: paymentSettings, isLoading, refetch } = useQuery<PaymentGatewaySettings | null>({
    queryKey: ["/api/settings/payment-gateway"],
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (paymentSettings) {
      setActiveGateway(paymentSettings.activeGateway || "NONE");
      setIsTestMode(paymentSettings.stripe?.isTestMode ?? true);
      setStripePublicKey(paymentSettings.stripe?.publicKey || "");
      setStripeSecretKey(paymentSettings.stripe?.secretKey || "");
      setStripeWebhookSecret(paymentSettings.stripe?.webhookSecret || "");
      setRazorpayKeyId(paymentSettings.razorpay?.keyId || "");
      setRazorpayKeySecret(paymentSettings.razorpay?.keySecret || "");
      setRazorpayWebhookSecret(paymentSettings.razorpay?.webhookSecret || "");
    }
  }, [paymentSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/settings/payment-gateway", {
        activeGateway,
        stripe: {
          publicKey: stripePublicKey,
          secretKey: stripeSecretKey,
          webhookSecret: stripeWebhookSecret,
          isTestMode,
        },
        razorpay: {
          keyId: razorpayKeyId,
          keySecret: razorpayKeySecret,
          webhookSecret: razorpayWebhookSecret,
          isTestMode,
        },
        isActive: activeGateway !== "NONE",
        currency: "INR",
        enabledMethods: ["card", "upi", "netbanking"],
      });

      toast({
        title: "Settings Saved",
        description: "Payment gateway settings have been updated successfully.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (activeGateway === "NONE") {
      toast({
        title: "No Gateway Selected",
        description: "Please select a payment gateway first.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    try {
      // First save the settings
      await handleSave();

      const response = await apiRequest("POST", "/api/settings/payment-gateway/test", {
        gateway: activeGateway,
      });

      toast({
        title: "Connection Successful",
        description: `${activeGateway} connection is working properly.`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || `Failed to connect to ${activeGateway}`,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gateway Selection */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Gateway
          </CardTitle>
          <CardDescription>
            Configure your preferred payment gateway for processing online payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gateway Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Payment Gateway</label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setActiveGateway("NONE")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeGateway === "NONE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                  <span className="font-medium">None</span>
                  <span className="text-xs text-muted-foreground">Disabled</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveGateway("STRIPE")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeGateway === "STRIPE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 bg-[#635BFF] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="font-medium">Stripe</span>
                  <span className="text-xs text-muted-foreground">International</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveGateway("RAZORPAY")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeGateway === "RAZORPAY"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 bg-[#072654] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <span className="font-medium">Razorpay</span>
                  <span className="text-xs text-muted-foreground">India</span>
                </div>
              </button>
            </div>
          </div>

          {/* Test Mode Toggle */}
          {activeGateway !== "NONE" && (
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">Test Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Use test/sandbox credentials for development
                  </p>
                </div>
              </div>
              <Switch
                checked={isTestMode}
                onCheckedChange={setIsTestMode}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Configuration */}
      {activeGateway === "STRIPE" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-6 w-6 bg-[#635BFF] rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              Stripe Configuration
            </CardTitle>
            <CardDescription>
              Enter your Stripe API credentials. Get them from your{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Publishable Key</label>
              <Input
                type="text"
                value={stripePublicKey}
                onChange={(e) => setStripePublicKey(e.target.value)}
                placeholder={isTestMode ? "pk_test_..." : "pk_live_..."}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Key</label>
              <div className="relative">
                <Input
                  type={showStripeSecret ? "text" : "password"}
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  placeholder={isTestMode ? "sk_test_..." : "sk_live_..."}
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowStripeSecret(!showStripeSecret)}
                >
                  {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook Secret (Optional)</label>
              <Input
                type="text"
                value={stripeWebhookSecret}
                onChange={(e) => setStripeWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Required for handling payment events. Configure webhook at Stripe Dashboard → Webhooks
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Razorpay Configuration */}
      {activeGateway === "RAZORPAY" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-6 w-6 bg-[#072654] rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              Razorpay Configuration
            </CardTitle>
            <CardDescription>
              Enter your Razorpay API credentials. Get them from your{" "}
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Razorpay Dashboard
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key ID</label>
              <Input
                type="text"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                placeholder={isTestMode ? "rzp_test_..." : "rzp_live_..."}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Key Secret</label>
              <div className="relative">
                <Input
                  type={showRazorpaySecret ? "text" : "password"}
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  placeholder="Enter your key secret"
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                >
                  {showRazorpaySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook Secret (Optional)</label>
              <Input
                type="text"
                value={razorpayWebhookSecret}
                onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                placeholder="Enter webhook secret"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Required for handling payment events. Configure at Razorpay Dashboard → Webhooks
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {activeGateway !== "NONE" && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testingConnection}>
            {testingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Payment Integration</h4>
              <p className="text-sm text-muted-foreground">
                Once configured, you can accept online payments directly from invoices.
                Clients will be able to pay using credit/debit cards, UPI, and net banking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
