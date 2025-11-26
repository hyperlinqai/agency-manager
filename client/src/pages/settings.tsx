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
import { Plus, Pencil, Building2, Save, Briefcase, Download } from "lucide-react";
import { ServiceDialog } from "@/components/service-dialog";
import { JobRoleDialog } from "@/components/job-role-dialog";
import { Badge } from "@/components/ui/badge";
import type { Service, CompanyProfile, JobRole } from "@shared/schema";
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

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: jobRoles = [], isLoading: isLoadingJobRoles } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });

  const { toast } = useToast();

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

  const handleSeedJobRoles = () => {
    seedJobRolesMutation.mutate();
  };

  const handleNewService = () => {
    setSelectedService(null);
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsServiceDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsServiceDialogOpen(false);
    setSelectedService(null);
  };

  const handleNewJobRole = () => {
    setSelectedJobRole(null);
    setIsJobRoleDialogOpen(true);
  };

  const handleEditJobRole = (role: JobRole) => {
    setSelectedJobRole(role);
    setIsJobRoleDialogOpen(true);
  };

  const handleCloseJobRoleDialog = () => {
    setIsJobRoleDialogOpen(false);
    setSelectedJobRole(null);
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
          <TabsTrigger value="job-roles" data-testid="tab-job-roles">Job Roles</TabsTrigger>
          <TabsTrigger value="company" data-testid="tab-company">Company Info</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Service Catalog</CardTitle>
                <Button onClick={handleNewService} data-testid="button-new-service">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : services && services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Default Price</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                        <TableCell className="font-medium" data-testid={`text-name-${service.id}`}>
                          {service.name}
                        </TableCell>
                        <TableCell data-testid={`text-category-${service.id}`}>
                          {getCategoryLabel(service.category)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={service.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                            data-testid={`badge-status-${service.id}`}
                          >
                            {service.status === "ACTIVE" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-price-${service.id}`}>
                          {service.currency} {formatCurrency(service.defaultPrice)}
                        </TableCell>
                        <TableCell data-testid={`text-currency-${service.id}`}>
                          {service.currency}
                        </TableCell>
                        <TableCell data-testid={`text-unit-${service.id}`}>
                          {service.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-updated-${service.id}`}>
                          {formatDate(service.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditService(service)}
                            data-testid={`button-edit-${service.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-services">
                  <p className="text-muted-foreground">No services found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first service to get started
                  </p>
                  <Button onClick={handleNewService} className="mt-4" data-testid="button-create-first-service">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job-roles" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle>Job Roles</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSeedJobRoles}
                    disabled={seedJobRolesMutation.isPending}
                    data-testid="button-load-default-roles"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {seedJobRolesMutation.isPending ? "Loading..." : "Load Default Roles"}
                  </Button>
                  <Button onClick={handleNewJobRole} data-testid="button-new-job-role">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job Role
                  </Button>
                </div>
              </div>
              <CardDescription>
                Manage job roles for team members. Click "Load Default Roles" to add common marketing agency roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingJobRoles ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : jobRoles && jobRoles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobRoles.map((role) => (
                      <TableRow key={role.id} data-testid={`row-job-role-${role.id}`}>
                        <TableCell className="font-medium" data-testid={`text-title-${role.id}`}>
                          {role.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-description-${role.id}`}>
                          {role.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={role.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                            data-testid={`badge-status-${role.id}`}
                          >
                            {role.status === "ACTIVE" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-updated-${role.id}`}>
                          {formatDate(role.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditJobRole(role)}
                            data-testid={`button-edit-${role.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-job-roles">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No job roles found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create job roles to use in team member profiles
                  </p>
                  <Button onClick={handleNewJobRole} className="mt-4" data-testid="button-create-first-job-role">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job Role
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4 mt-6">
          <CompanySettingsForm />
        </TabsContent>
      </Tabs>

      <ServiceDialog
        service={selectedService}
        open={isServiceDialogOpen}
        onClose={handleCloseDialog}
      />

      <JobRoleDialog
        role={selectedJobRole}
        open={isJobRoleDialogOpen}
        onClose={handleCloseJobRoleDialog}
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
      <Card>
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Company Information</CardTitle>
            </div>
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
                      <Input {...field} placeholder="Acme Corporation" data-testid="input-company-name" />
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
                      <Input {...field} type="email" placeholder="contact@company.com" data-testid="input-email" />
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
                      <Input {...field} placeholder="+1 234 567 8900" data-testid="input-phone" />
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
                      <Input {...field} placeholder="123 Main Street" data-testid="input-address-1" />
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
                      <Input {...field} value={field.value || ""} placeholder="Suite 100" data-testid="input-address-2" />
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
                      <Input {...field} placeholder="New York" data-testid="input-city" />
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
                      <Input {...field} placeholder="NY" data-testid="input-state" />
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
                      <Input {...field} placeholder="10001" data-testid="input-postal" />
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
                      <Input {...field} placeholder="United States" data-testid="input-country" />
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
                      <Input {...field} placeholder="GST1234567890" data-testid="input-tax-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banking Details</CardTitle>
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
                      <Input {...field} placeholder="HDFC Bank" data-testid="input-bank-name" />
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
                      <Input {...field} placeholder="50200012345678" data-testid="input-account-number" />
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
                      <Input {...field} placeholder="HDFC0001234" data-testid="input-ifsc" />
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
                    <FormLabel>Payment Gateway Details</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Optional payment gateway information or fees"
                        data-testid="input-gateway-details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
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
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Payment terms, late fees, etc."
                      rows={6}
                      data-testid="input-invoice-terms"
                    />
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
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Thank you notes or additional payment instructions"
                      rows={3}
                      data-testid="input-payment-notes"
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
            <CardTitle>Authorized Signatory</CardTitle>
            <CardDescription>Person authorized to sign invoices and documents</CardDescription>
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
                      <Input {...field} placeholder="John Doe" data-testid="input-signatory-name" />
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
                      <Input {...field} placeholder="Proprietor" data-testid="input-signatory-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-company">
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
