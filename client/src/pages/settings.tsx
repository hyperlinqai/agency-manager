import { useState } from "react";
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
} from "lucide-react";
import { ServiceDialog } from "@/components/service-dialog";
import { JobRoleDialog } from "@/components/job-role-dialog";
import { ExpenseCategoryDialog } from "@/components/expense-category-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import type { Service, CompanyProfile, JobRole, ExpenseCategory } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanyProfileSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

  const { data: jobRoles = [], isLoading: isLoadingJobRoles } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });

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
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="services" className="gap-2" data-testid="tab-services">
            <Package className="h-4 w-4 hidden sm:inline" />
            Services
          </TabsTrigger>
          <TabsTrigger value="expense-categories" className="gap-2" data-testid="tab-expense-categories">
            <Tags className="h-4 w-4 hidden sm:inline" />
            Expense Categories
          </TabsTrigger>
          <TabsTrigger value="job-roles" className="gap-2" data-testid="tab-job-roles">
            <Briefcase className="h-4 w-4 hidden sm:inline" />
            Job Roles
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

        {/* Company Tab */}
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
