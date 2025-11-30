import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, 
  Palette, 
  Globe, 
  Share2, 
  BarChart3, 
  Settings, 
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Lock,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Database,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ClientOnboardingData } from "@shared/schema";

const STEPS = [
  { id: 1, title: "Business Details", icon: Building2, description: "Company information & KYC" },
  { id: 2, title: "Brand Assets", icon: Palette, description: "Logo, colors & guidelines" },
  { id: 3, title: "Website Access", icon: Globe, description: "Hosting & domain credentials" },
  { id: 4, title: "Social Accounts", icon: Share2, description: "Social media & ad platforms" },
  { id: 5, title: "CRM & Tools", icon: Database, description: "Marketing automation access" },
  { id: 6, title: "Marketing History", icon: BarChart3, description: "Past campaigns & reports" },
  { id: 7, title: "Project Details", icon: MessageSquare, description: "Communication & expectations" },
  { id: 8, title: "Review & Submit", icon: Send, description: "Confirm and submit" },
];

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited",
  "Public Limited",
  "LLP",
  "NGO/Non-Profit",
  "Other"
];

const INDUSTRIES = [
  "Technology",
  "E-commerce",
  "Healthcare",
  "Education",
  "Finance",
  "Real Estate",
  "Manufacturing",
  "Retail",
  "Food & Beverage",
  "Travel & Hospitality",
  "Professional Services",
  "Other"
];

const WEBSITE_CREDENTIAL_TYPES = [
  { value: "HOSTING", label: "Web Hosting" },
  { value: "DOMAIN", label: "Domain Registrar" },
  { value: "CMS", label: "CMS (WordPress, etc.)" },
  { value: "FTP", label: "FTP/SFTP" },
  { value: "DATABASE", label: "Database" },
  { value: "CDN", label: "CDN" },
  { value: "ANALYTICS", label: "Analytics" },
  { value: "OTHER", label: "Other" },
];

const SOCIAL_PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TWITTER", label: "Twitter/X" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "PINTEREST", label: "Pinterest" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "META_ADS", label: "Meta Ads Manager" },
  { value: "GOOGLE_ANALYTICS", label: "Google Analytics" },
  { value: "OTHER", label: "Other" },
];

const CRM_PLATFORMS = [
  { value: "HUBSPOT", label: "HubSpot" },
  { value: "SALESFORCE", label: "Salesforce" },
  { value: "ZOHO", label: "Zoho CRM" },
  { value: "MAILCHIMP", label: "Mailchimp" },
  { value: "KLAVIYO", label: "Klaviyo" },
  { value: "ACTIVECAMPAIGN", label: "ActiveCampaign" },
  { value: "GOHIGHLEVEL", label: "GoHighLevel" },
  { value: "OTHER", label: "Other" },
];

const COMMUNICATION_METHODS = [
  "Email",
  "Phone/WhatsApp",
  "Slack",
  "Microsoft Teams",
  "Zoom",
  "Google Meet"
];

const onboardingFormSchema = z.object({
  businessDetails: z.object({
    legalName: z.string().optional(),
    tradeName: z.string().optional(),
    businessType: z.string().optional(),
    registrationNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    incorporationDate: z.string().optional(),
    industry: z.string().optional(),
    employeeCount: z.string().optional(),
    annualRevenue: z.string().optional(),
    targetAudience: z.string().optional(),
    competitors: z.string().optional(),
    uniqueSellingPoint: z.string().optional(),
    businessGoals: z.string().optional(),
    notes: z.string().optional(),
  }),
  brandAssets: z.object({
    logoUrl: z.string().optional(),
    primaryColors: z.array(z.string()).default([]),
    secondaryColors: z.array(z.string()).default([]),
    fonts: z.array(z.string()).default([]),
    tagline: z.string().optional(),
    brandVoice: z.string().optional(),
    brandPersonality: z.string().optional(),
    brandGuidelinesUrl: z.string().optional(),
    doNotUse: z.string().optional(),
    notes: z.string().optional(),
  }),
  websiteCredentials: z.object({
    items: z.array(z.object({
      type: z.string(),
      name: z.string(),
      url: z.string(),
      username: z.string(),
      password: z.string(),
      notes: z.string().optional(),
    })).default([]),
  }),
  socialCredentials: z.object({
    items: z.array(z.object({
      platform: z.string(),
      accountName: z.string(),
      accountUrl: z.string(),
      username: z.string(),
      password: z.string(),
      accessLevel: z.string().optional(),
      notes: z.string().optional(),
    })).default([]),
  }),
  crmCredentials: z.object({
    items: z.array(z.object({
      platform: z.string(),
      accountName: z.string(),
      accountUrl: z.string(),
      username: z.string(),
      password: z.string(),
      apiKey: z.string().optional(),
      notes: z.string().optional(),
    })).default([]),
  }),
  marketingReports: z.object({
    currentMarketingEfforts: z.string().optional(),
    pastCampaigns: z.string().optional(),
    whatWorked: z.string().optional(),
    whatDidntWork: z.string().optional(),
  }),
  projectDetails: z.object({
    preferredCommunication: z.string().optional(),
    meetingAvailability: z.string().optional(),
    decisionMakers: z.string().optional(),
    budget: z.string().optional(),
    timeline: z.string().optional(),
    priorities: z.string().optional(),
    expectations: z.string().optional(),
    kickoffNotes: z.string().optional(),
  }),
  additionalNotes: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

interface ClientInfo {
  clientId: string;
  companyName: string;
  contactName: string;
  email: string;
  onboardingCompleted: boolean;
}

interface PublicOnboardingPageProps {
  token?: string;
}

export default function PublicOnboardingPage({ token }: PublicOnboardingPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch client info
  const { data: clientInfo, isLoading: clientLoading, error: clientError } = useQuery<ClientInfo>({
    queryKey: ["/api/public/onboarding", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/onboarding/${token}`);
      if (!res.ok) throw new Error("Invalid onboarding link");
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch existing onboarding data
  const { data: existingData, isLoading: dataLoading } = useQuery<ClientOnboardingData>({
    queryKey: ["/api/public/onboarding-data", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/onboarding/${token}/data`);
      if (!res.ok) throw new Error("Failed to fetch onboarding data");
      return res.json();
    },
    enabled: !!token && !!clientInfo,
  });

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      businessDetails: {},
      brandAssets: { primaryColors: [], secondaryColors: [], fonts: [] },
      websiteCredentials: { items: [] },
      socialCredentials: { items: [] },
      crmCredentials: { items: [] },
      marketingReports: {},
      projectDetails: {},
      additionalNotes: "",
    },
  });

  // Update form when data loads
  useState(() => {
    if (existingData) {
      form.reset({
        businessDetails: existingData.businessDetails || {},
        brandAssets: existingData.brandAssets || { primaryColors: [], secondaryColors: [], fonts: [] },
        websiteCredentials: existingData.websiteCredentials || { items: [] },
        socialCredentials: existingData.socialCredentials || { items: [] },
        crmCredentials: existingData.crmCredentials || { items: [] },
        marketingReports: existingData.marketingReports || {},
        projectDetails: existingData.projectDetails || {},
        additionalNotes: existingData.additionalNotes || "",
      });
    }
  });

  const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({
    control: form.control,
    name: "websiteCredentials.items",
  });

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control: form.control,
    name: "socialCredentials.items",
  });

  const { fields: crmFields, append: appendCrm, remove: removeCrm } = useFieldArray({
    control: form.control,
    name: "crmCredentials.items",
  });

  // Save progress mutation
  const saveMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const res = await fetch(`/api/public/onboarding/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/onboarding-data", token] });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      // First save the data
      await saveMutation.mutateAsync(form.getValues());
      
      // Then submit
      const res = await fetch(`/api/public/onboarding/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to submit onboarding");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Onboarding Submitted!",
        description: "Thank you for completing the onboarding process. Our team will review your information.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/public/onboarding", token] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProgress = async () => {
    try {
      await saveMutation.mutateAsync(form.getValues());
      toast({
        title: "Progress Saved",
        description: "Your information has been saved. You can continue later.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    // Save progress when moving to next step
    await saveMutation.mutateAsync(form.getValues());
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  if (clientLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96 text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading onboarding form...</p>
        </Card>
      </div>
    );
  }

  if (clientError || !clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96 text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold mt-4">Invalid Link</h2>
          <p className="mt-2 text-muted-foreground">
            This onboarding link is invalid or has expired. Please contact the team for a new link.
          </p>
        </Card>
      </div>
    );
  }

  if (clientInfo.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-96 text-center p-8">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-semibold mt-4">Onboarding Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            Thank you, {clientInfo.contactName}! Your onboarding information has been submitted successfully.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Our team will review your information and get in touch soon.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Client Onboarding</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {clientInfo.contactName} from {clientInfo.companyName}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSaveProgress} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Progress
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 min-w-max">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                    isCurrent && "bg-primary text-primary-foreground",
                    isCompleted && !isCurrent && "bg-green-100 text-green-700",
                    !isCurrent && !isCompleted && "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Form {...form}>
          <form className="space-y-6">
            {/* Step 1: Business Details */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Business Details & KYC
                  </CardTitle>
                  <CardDescription>
                    Tell us about your business for our records
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessDetails.legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Registered company name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDetails.tradeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Name / Brand Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Name you operate as" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessDetails.businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BUSINESS_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDetails.industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="businessDetails.registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="CIN / Registration No." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDetails.gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input placeholder="GSTIN" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDetails.panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <Input placeholder="PAN" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="businessDetails.incorporationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Established</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2020" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDetails.employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10-50" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDetails.annualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Revenue Range</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ₹50L - 1Cr" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessDetails.targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your ideal customers (demographics, interests, behavior)"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessDetails.competitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Competitors</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List your top 3-5 competitors"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessDetails.uniqueSellingPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unique Selling Point (USP)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What makes your business unique? Why should customers choose you?"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessDetails.businessGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Goals for This Engagement</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What do you want to achieve? (e.g., increase leads, brand awareness, sales)"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Brand Assets */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Brand Assets
                  </CardTitle>
                  <CardDescription>
                    Share your brand identity for creative consistency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="brandAssets.logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL or Google Drive Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Link to your logo files (PNG, SVG, AI)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Share a link to your logo in various formats (PNG, SVG, AI, EPS)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brandAssets.primaryColors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Brand Colors</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., #FF5733, #2E86AB"
                              value={field.value?.join(", ") || ""}
                              onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            />
                          </FormControl>
                          <FormDescription>Enter hex codes separated by commas</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brandAssets.secondaryColors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Colors</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., #FFFFFF, #333333"
                              value={field.value?.join(", ") || ""}
                              onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            />
                          </FormControl>
                          <FormDescription>Enter hex codes separated by commas</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="brandAssets.fonts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Fonts</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Montserrat, Open Sans"
                            value={field.value?.join(", ") || ""}
                            onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                          />
                        </FormControl>
                        <FormDescription>Enter font names separated by commas</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandAssets.tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline / Slogan</FormLabel>
                        <FormControl>
                          <Input placeholder="Your brand's tagline" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandAssets.brandVoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Voice & Tone</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How should your brand communicate? (e.g., professional, friendly, playful, authoritative)"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandAssets.brandPersonality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Personality</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="If your brand were a person, how would you describe them?"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandAssets.brandGuidelinesUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Guidelines Document</FormLabel>
                        <FormControl>
                          <Input placeholder="Link to brand guidelines PDF/document" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandAssets.doNotUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do Not Use / Avoid</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any words, imagery, or styles to avoid?"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Website Credentials */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Website & Hosting Access
                  </CardTitle>
                  <CardDescription>
                    Share your website-related credentials for audits and development
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Your credentials are secure</p>
                      <p className="text-xs text-amber-700">All information is encrypted and only accessible to authorized team members.</p>
                    </div>
                  </div>

                  {websiteFields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Credential #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWebsite(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`websiteCredentials.items.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {WEBSITE_CREDENTIAL_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`websiteCredentials.items.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name / Provider</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., GoDaddy, Hostinger" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`websiteCredentials.items.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Login URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`websiteCredentials.items.${index}.username`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username / Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`websiteCredentials.items.${index}.password`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`websiteCredentials.items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Input placeholder="Any additional notes" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendWebsite({
                      type: "",
                      name: "",
                      url: "",
                      username: "",
                      password: "",
                      notes: "",
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Website Credential
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Social Credentials */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Social Media & Ad Accounts
                  </CardTitle>
                  <CardDescription>
                    Share your social media and advertising platform access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Secure access management</p>
                      <p className="text-xs text-amber-700">For ad accounts, consider adding us as partners/admins instead of sharing passwords.</p>
                    </div>
                  </div>

                  {socialFields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Account #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSocial(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`socialCredentials.items.${index}.platform`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SOCIAL_PLATFORMS.map((platform) => (
                                      <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`socialCredentials.items.${index}.accountName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account / Page Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="@yourhandle or Page Name" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`socialCredentials.items.${index}.accountUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile / Page URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`socialCredentials.items.${index}.username`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username / Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`socialCredentials.items.${index}.password`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`socialCredentials.items.${index}.accessLevel`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Access Level Needed</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Admin, Editor, Partner" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendSocial({
                      platform: "",
                      accountName: "",
                      accountUrl: "",
                      username: "",
                      password: "",
                      accessLevel: "",
                      notes: "",
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Social Account
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 5: CRM Credentials */}
            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    CRM & Marketing Tools
                  </CardTitle>
                  <CardDescription>
                    Share access to your CRM, email marketing, and automation tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {crmFields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Tool #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCrm(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`crmCredentials.items.${index}.platform`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {CRM_PLATFORMS.map((platform) => (
                                      <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`crmCredentials.items.${index}.accountName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`crmCredentials.items.${index}.accountUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Login URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`crmCredentials.items.${index}.username`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username / Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`crmCredentials.items.${index}.password`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`crmCredentials.items.${index}.apiKey`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Key (if applicable)</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendCrm({
                      platform: "",
                      accountName: "",
                      accountUrl: "",
                      username: "",
                      password: "",
                      apiKey: "",
                      notes: "",
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add CRM / Marketing Tool
                  </Button>

                  {crmFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No CRM or marketing tools? Click above to add one, or skip to the next step.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 6: Marketing History */}
            {currentStep === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Marketing History & Benchmarks
                  </CardTitle>
                  <CardDescription>
                    Tell us about your past marketing efforts for benchmarking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="marketingReports.currentMarketingEfforts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Marketing Efforts</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What marketing activities are you currently doing? (e.g., social media, SEO, paid ads)"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marketingReports.pastCampaigns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Past Campaigns</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe any significant marketing campaigns you've run in the past"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="marketingReports.whatWorked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What Worked Well?</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Which marketing activities brought the best results?"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="marketingReports.whatDidntWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What Didn't Work?</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any activities that didn't deliver results?"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 7: Project Details */}
            {currentStep === 7 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Project & Communication Preferences
                  </CardTitle>
                  <CardDescription>
                    Help us understand how you'd like to work together
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="projectDetails.preferredCommunication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Communication Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preferred method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMUNICATION_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDetails.meetingAvailability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Availability</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="When are you typically available for calls/meetings? (e.g., Mon-Fri 10am-5pm IST)"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDetails.decisionMakers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Decision Makers</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Who will be involved in approving work? (names and roles)"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectDetails.budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Budget Range</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ₹50,000 - ₹1,00,000" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="projectDetails.timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Timeline</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3-6 months" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="projectDetails.priorities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Top Priorities</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your top 3 priorities for this engagement?"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDetails.expectations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expectations</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What does success look like to you? Any specific KPIs or targets?"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Anything else you'd like us to know?"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 8: Review & Submit */}
            {currentStep === 8 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Review & Submit
                  </CardTitle>
                  <CardDescription>
                    Please review your information before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">Business Details</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {form.watch("businessDetails.legalName") || "Not provided"}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Palette className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">Brand Assets</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {form.watch("brandAssets.primaryColors")?.length || 0} colors, {form.watch("brandAssets.fonts")?.length || 0} fonts
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">Website Access</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {websiteFields.length} credential(s)
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Share2 className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">Social Accounts</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {socialFields.length} account(s)
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">CRM & Tools</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {crmFields.length} tool(s)
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">Project Details</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {form.watch("projectDetails.preferredCommunication") || "Not specified"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-800">Ready to Submit</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      By submitting, you confirm that the information provided is accurate. Our team will review your details and reach out to schedule a kickoff meeting.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Onboarding Information
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < STEPS.length && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

