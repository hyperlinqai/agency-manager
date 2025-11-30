import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  FileText,
  Palette,
  DollarSign,
  Clock,
  Target,
  Check,
  Building2,
  Briefcase,
  Calculator,
  Send,
  Sparkles,
} from "lucide-react";
import { AIProposalAssistant } from "@/components/ai-proposal-assistant";
import { cn, formatCurrency } from "@/lib/utils";
import type { Client, ProposalService } from "@shared/schema";
import { marketingServices } from "@shared/schema";

const MARKETING_SERVICES: { value: typeof marketingServices[number]; label: string; icon: string; description: string }[] = [
  { value: "SOCIAL_MEDIA", label: "Social Media Management", icon: "📱", description: "Content creation, scheduling, and community management" },
  { value: "PAID_ADS", label: "Paid Advertising", icon: "📢", description: "Google Ads, Meta Ads, LinkedIn Ads campaigns" },
  { value: "WEB_DEVELOPMENT", label: "Web Development", icon: "🌐", description: "Website design, development, and maintenance" },
  { value: "AUTOMATION", label: "Marketing Automation", icon: "⚡", description: "Email sequences, workflows, and lead nurturing" },
  { value: "CRM_SETUP", label: "CRM Setup & Integration", icon: "🔧", description: "CRM configuration, migration, and training" },
  { value: "EMAIL_SMS", label: "Email & SMS Marketing", icon: "📧", description: "Campaign design, list management, and analytics" },
  { value: "FUNNELS", label: "Sales Funnels", icon: "📊", description: "Landing pages, lead magnets, and conversion optimization" },
  { value: "SEO", label: "SEO Services", icon: "🔍", description: "On-page, off-page, technical SEO, and content strategy" },
  { value: "CONTENT_MARKETING", label: "Content Marketing", icon: "✍️", description: "Blog posts, articles, whitepapers, and guides" },
  { value: "BRANDING", label: "Branding & Design", icon: "🎨", description: "Logo design, brand guidelines, and visual identity" },
  { value: "VIDEO_PRODUCTION", label: "Video Production", icon: "🎬", description: "Video content, editing, and animation" },
  { value: "INFLUENCER_MARKETING", label: "Influencer Marketing", icon: "⭐", description: "Influencer partnerships and campaign management" },
];

const proposalFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  validUntil: z.string().min(1, "Validity date is required"),

  services: z.array(z.object({
    serviceType: z.enum(marketingServices),
    name: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()),
    kpis: z.array(z.string()),
    price: z.number().min(0),
    timeline: z.string(),
  })),
  
  projectStartDate: z.string().optional(),
  projectEndDate: z.string().optional(),
  projectDuration: z.string().optional(),
  
  discount: z.number().min(0).default(0),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("FIXED"),
  taxRate: z.number().min(0).default(18),
  
  paymentTerms: z.string().optional(),
  paymentSchedule: z.array(z.object({
    milestone: z.string(),
    percentage: z.number(),
    amount: z.number(),
    dueDate: z.string().optional(),
  })),
  
  executiveSummary: z.string().optional(),
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
  
  showCompanyLogo: z.boolean().default(true),
  customHeaderText: z.string().optional(),
  customFooterText: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalFormSchema>;

const steps = [
  { id: 1, title: "Client & Title", description: "Basic details", icon: Building2 },
  { id: 2, title: "Services", description: "Select services", icon: Briefcase },
  { id: 3, title: "Pricing", description: "Set pricing", icon: Calculator },
  { id: 4, title: "Timeline", description: "Project timeline", icon: Clock },
  { id: 5, title: "Review", description: "Finalize", icon: Send },
];

export default function ProposalCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<(typeof marketingServices[number])[]>([]);

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      clientId: "",
      title: "",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      services: [],
      projectStartDate: "",
      projectEndDate: "",
      projectDuration: "",
      discount: 0,
      discountType: "FIXED",
      taxRate: 18,
      paymentTerms: "50% advance, 50% on completion",
      paymentSchedule: [
        { milestone: "Project Kickoff", percentage: 50, amount: 0, dueDate: "" },
        { milestone: "Project Completion", percentage: 50, amount: 0, dueDate: "" },
      ],
      executiveSummary: "",
      termsAndConditions: "",
      notes: "",
      showCompanyLogo: true,
      customHeaderText: "",
      customFooterText: "",
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: "paymentSchedule",
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data: ProposalFormData) => {
      // Calculate totals
      const subtotal = data.services.reduce((sum, s) => sum + (s.price || 0), 0);
      const discountAmount = data.discountType === "PERCENTAGE"
        ? (subtotal * (data.discount || 0) / 100)
        : (data.discount || 0);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * ((data.taxRate || 18) / 100);
      const totalAmount = afterDiscount + taxAmount;

      // Ensure all required fields have proper defaults
      const payload = {
        clientId: data.clientId,
        title: data.title,
        validUntil: data.validUntil,
        services: data.services.map(s => ({
          serviceType: s.serviceType,
          name: s.name || "",
          description: s.description || "",
          deliverables: s.deliverables || [],
          kpis: s.kpis || [],
          price: s.price || 0,
          timeline: s.timeline || "",
        })),
        projectStartDate: data.projectStartDate || null,
        projectEndDate: data.projectEndDate || null,
        projectDuration: data.projectDuration || "",
        subtotal,
        discount: data.discount || 0,
        discountType: data.discountType || "FIXED",
        taxRate: data.taxRate || 18,
        taxAmount,
        totalAmount,
        paymentTerms: data.paymentTerms || "",
        paymentSchedule: (data.paymentSchedule || []).map(p => ({
          milestone: p.milestone || "",
          percentage: p.percentage || 0,
          amount: (totalAmount * (p.percentage || 0)) / 100,
          dueDate: p.dueDate || null,
        })),
        executiveSummary: data.executiveSummary || "",
        termsAndConditions: data.termsAndConditions || "",
        notes: data.notes || "",
        showCompanyLogo: data.showCompanyLogo ?? true,
        customHeaderText: data.customHeaderText || "",
        customFooterText: data.customFooterText || "",
        status: "DRAFT",
      };

      return apiRequest("POST", "/api/proposals", payload);
    },
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Proposal created!",
        description: `Proposal "${proposal.title}" has been created successfully.`,
      });
      setLocation("/proposals");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const watchedServices = form.watch("services");
  const watchedDiscount = form.watch("discount");
  const watchedDiscountType = form.watch("discountType");
  const watchedTaxRate = form.watch("taxRate");

  const subtotal = watchedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const discountAmount = watchedDiscountType === "PERCENTAGE" 
    ? (subtotal * watchedDiscount / 100) 
    : watchedDiscount;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (watchedTaxRate / 100);
  const totalAmount = afterDiscount + taxAmount;

  const handleServiceToggle = (serviceValue: typeof marketingServices[number]) => {
    const isSelected = selectedServices.includes(serviceValue);

    if (isSelected) {
      // Remove service
      setSelectedServices(prev => prev.filter(s => s !== serviceValue));
      const currentServices = form.getValues("services");
      const index = currentServices.findIndex(s => s.serviceType === serviceValue);
      if (index !== -1) {
        removeService(index);
      }
    } else {
      // Add service
      setSelectedServices(prev => [...prev, serviceValue]);
      const serviceInfo = MARKETING_SERVICES.find(s => s.value === serviceValue);
      if (serviceInfo) {
        appendService({
          serviceType: serviceValue,
          name: serviceInfo.label,
          description: serviceInfo.description || "",
          deliverables: [] as string[],
          kpis: [] as string[],
          price: 0,
          timeline: "",
        });
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createProposalMutation.mutate(form.getValues());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/proposals">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create Proposal</h1>
              <p className="text-sm text-muted-foreground">
                Build a custom proposal with services, pricing, and branding
              </p>
            </div>
          </div>
          <AIProposalAssistant
            clients={clients || []}
            onApplyTemplate={(template) => {
              // Apply template data to form
              form.setValue("executiveSummary", template.executiveSummary);
              form.setValue("termsAndConditions", template.termsAndConditions);

              // Set services from template
              const templateServices = template.defaultServices.map((s) => ({
                serviceType: s.serviceType as typeof marketingServices[number],
                name: s.name,
                description: s.description,
                deliverables: s.deliverables,
                kpis: s.kpis,
                price: s.price,
                timeline: s.timeline,
              }));
              form.setValue("services", templateServices);
              setSelectedServices(template.defaultServices.map((s) => s.serviceType as typeof marketingServices[number]));
            }}
            onApplyGeneratedContent={(content) => {
              if (content.executiveSummary) {
                form.setValue("executiveSummary", content.executiveSummary);
              }
              if (content.termsAndConditions) {
                form.setValue("termsAndConditions", content.termsAndConditions);
              }
            }}
          />
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-background border-primary text-primary"
                        : "bg-muted border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-xl">
          <Form {...form}>
            <form>
              {/* Step 1: Client & Title */}
              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Client & Proposal Details
                    </CardTitle>
                    <CardDescription>
                      Select the client and provide a title for this proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
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
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposal Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Digital Marketing Proposal for Q1 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            The proposal will expire after this date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="executiveSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Executive Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief overview of your proposal and the value you'll deliver..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {/* Step 2: Services */}
              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Select Services
                    </CardTitle>
                    <CardDescription>
                      Choose the services you want to include in this proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {MARKETING_SERVICES.map((service) => {
                        const isSelected = selectedServices.includes(service.value);
                        return (
                          <div
                            key={service.value}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md select-none",
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-muted hover:border-primary/50"
                            )}
                            onClick={() => handleServiceToggle(service.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleServiceToggle(service.value);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{service.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm">{service.label}</h4>
                                  <div 
                                    className={cn(
                                      "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                                      isSelected 
                                        ? "bg-primary border-primary" 
                                        : "border-muted-foreground/30"
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedServices.length > 0 && (
                      <div className="border-t pt-6 mt-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Service Details & Deliverables
                        </h3>
                        <div className="space-y-6">
                          {serviceFields.map((field, index) => {
                            // Get the service type from form values, not field directly
                            const currentServices = form.getValues("services");
                            const serviceType = currentServices[index]?.serviceType || "";
                            const serviceInfo = MARKETING_SERVICES.find(s => s.value === serviceType);
                            
                            if (!serviceInfo) return null;
                            
                            return (
                              <Card key={field.id} className="border-dashed">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <span>{serviceInfo.icon}</span>
                                    {serviceInfo.label}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name={`services.${index}.description`}
                                    render={({ field: descField }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Describe what's included in this service..."
                                            rows={2}
                                            {...descField} 
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`services.${index}.price`}
                                      render={({ field: priceField }) => (
                                        <FormItem>
                                          <FormLabel>Price (₹)</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="number" 
                                              placeholder="0"
                                              value={priceField.value || ""}
                                              onChange={(e) => priceField.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name={`services.${index}.timeline`}
                                      render={({ field: timelineField }) => (
                                        <FormItem>
                                          <FormLabel>Timeline</FormLabel>
                                          <FormControl>
                                            <Input placeholder="e.g., 2 weeks" {...timelineField} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {/* Step 3: Pricing */}
              {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      Pricing & Payment
                    </CardTitle>
                    <CardDescription>
                      Set pricing, discounts, and payment terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pricing Summary */}
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal ({watchedServices.length} services)</span>
                            <span className="font-mono">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Discount</span>
                            <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax ({watchedTaxRate}%)</span>
                            <span className="font-mono">{formatCurrency(taxAmount)}</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="font-mono text-primary">{formatCurrency(totalAmount)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
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
                                <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                              </SelectContent>
                            </Select>
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
                                placeholder="18"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., 50% advance, 50% on completion"
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Payment Schedule */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Payment Schedule</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendPayment({ milestone: "", percentage: 0, amount: 0, dueDate: "" })}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Milestone
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {paymentFields.map((field, index) => (
                          <div key={field.id} className="flex gap-3 items-end">
                            <FormField
                              control={form.control}
                              name={`paymentSchedule.${index}.milestone`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel className={index > 0 ? "sr-only" : ""}>Milestone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Project Kickoff" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`paymentSchedule.${index}.percentage`}
                              render={({ field }) => (
                                <FormItem className="w-24">
                                  <FormLabel className={index > 0 ? "sr-only" : ""}>%</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="50"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePayment(index)}
                              disabled={paymentFields.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 4: Timeline */}
              {currentStep === 4 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Project Timeline & Branding
                    </CardTitle>
                    <CardDescription>
                      Set project dates and customize branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="projectStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="projectEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="projectDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 3 months" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        Branding & Customization
                      </h4>
                      
                      <FormField
                        control={form.control}
                        name="showCompanyLogo"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0 mb-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              Show company logo on proposal
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="customHeaderText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Header Text</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional header text to display on proposal" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="customFooterText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Footer Text</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional footer text (e.g., thank you message)" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="termsAndConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any terms and conditions for this proposal..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Review Proposal
                    </CardTitle>
                    <CardDescription>
                      Review all details before creating the proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Client & Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Client</span>
                            <span className="font-medium">
                              {clients?.find(c => c.id === form.watch("clientId"))?.name || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Title</span>
                            <span className="font-medium">{form.watch("title") || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Valid Until</span>
                            <span className="font-medium">{form.watch("validUntil") || "—"}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Pricing Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b text-red-600">
                            <span>Discount</span>
                            <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Tax ({watchedTaxRate}%)</span>
                            <span className="font-mono">{formatCurrency(taxAmount)}</span>
                          </div>
                          <div className="flex justify-between py-2 font-bold text-lg">
                            <span>Total</span>
                            <span className="font-mono text-primary">{formatCurrency(totalAmount)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Selected Services ({watchedServices.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {watchedServices.map((service, index) => {
                            const serviceInfo = MARKETING_SERVICES.find(s => s.value === service.serviceType);
                            return (
                              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div className="flex items-center gap-2">
                                  <span>{serviceInfo?.icon}</span>
                                  <span className="font-medium">{serviceInfo?.label}</span>
                                </div>
                                <span className="font-mono">{formatCurrency(service.price)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < 5 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleSubmit}
                    disabled={createProposalMutation.isPending}
                    className="bg-gradient-to-r from-primary to-emerald-500"
                  >
                    {createProposalMutation.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Proposal
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

