import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, Check, User, Building2, Briefcase, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const clientOnboardingSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  
  // Step 2: Business Details
  industry: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gstNumber: z.string().optional(),
  
  // Step 3: Project Setup (optional)
  createProject: z.boolean().default(false),
  projectName: z.string().optional(),
  projectScope: z.string().optional(),
  projectStartDate: z.string().optional(),
});

type ClientOnboardingData = z.infer<typeof clientOnboardingSchema>;

const steps = [
  { id: 1, title: "Basic Info", description: "Contact details", icon: User },
  { id: 2, title: "Business Details", description: "Company information", icon: Building2 },
  { id: 3, title: "First Project", description: "Optional setup", icon: Briefcase },
  { id: 4, title: "Review", description: "Confirm & complete", icon: CheckCircle2 },
];

const INDUSTRIES = [
  "Technology",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Real Estate",
  "Manufacturing",
  "Retail",
  "Food & Beverage",
  "Media & Entertainment",
  "Travel & Hospitality",
  "Professional Services",
  "Non-Profit",
  "Other",
];

export default function ClientOnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ClientOnboardingData>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      website: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      gstNumber: "",
      createProject: false,
      projectName: "",
      projectScope: "",
      projectStartDate: new Date().toISOString().split("T")[0],
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientOnboardingData) => {
      // Create client
      const clientPayload = {
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone || "",
        address: [data.address, data.city, data.state, data.pincode, data.country].filter(Boolean).join(", "),
        gstNumber: data.gstNumber || "",
        status: "ACTIVE",
      };
      
      const client = await apiRequest("POST", "/api/clients", clientPayload);
      
      // Create project if requested
      if (data.createProject && data.projectName) {
        await apiRequest("POST", "/api/projects", {
          clientId: client.id,
          name: data.projectName,
          scope: data.projectScope || "",
          startDate: data.projectStartDate,
          status: "IN_PROGRESS",
        });
      }
      
      return client;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Client onboarded successfully!",
        description: `${client.name} has been added to your clients.`,
      });
      setLocation(`/clients/${client.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof ClientOnboardingData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ["name", "contactName", "email"];
        break;
      case 2:
        fieldsToValidate = [];
        break;
      case 3:
        if (form.getValues("createProject")) {
          fieldsToValidate = ["projectName"];
        }
        break;
    }
    
    if (fieldsToValidate.length === 0) return true;
    
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createClientMutation.mutate(form.getValues());
  };

  const watchedValues = form.watch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Client Onboarding</h1>
            <p className="text-sm text-muted-foreground">
              Add a new client to your agency in a few simple steps
            </p>
          </div>
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
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Enter the primary contact details for this client
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Client Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 98765 43210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Business Details
                    </CardTitle>
                    <CardDescription>
                      Additional information about the client's business (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="industry"
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
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
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
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Business Park, Tower A" {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Mumbai" {...field} />
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
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="Maharashtra" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input placeholder="400001" {...field} />
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
                              <Input placeholder="India" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input placeholder="27AABCU9603R1ZM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {/* Step 3: First Project */}
              {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      First Project Setup
                    </CardTitle>
                    <CardDescription>
                      Optionally create the first project for this client
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="createProject"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <FormLabel className="!mt-0 cursor-pointer">
                              Create a project for this client now
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchedValues.createProject && (
                      <div className="space-y-4 pl-7 border-l-2 border-primary/20">
                        <FormField
                          control={form.control}
                          name="projectName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Website Redesign" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="projectScope"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Scope</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the project scope, deliverables, etc."
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="projectStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    {!watchedValues.createProject && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>You can always add projects later from the client detail page.</p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Review & Confirm
                    </CardTitle>
                    <CardDescription>
                      Please review the information before completing the onboarding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Basic Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Company Name</span>
                            <span className="font-medium">{watchedValues.name || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Contact Person</span>
                            <span className="font-medium">{watchedValues.contactName || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium">{watchedValues.email || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Phone</span>
                            <span className="font-medium">{watchedValues.phone || "—"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          Business Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Industry</span>
                            <span className="font-medium">{watchedValues.industry || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Website</span>
                            <span className="font-medium">{watchedValues.website || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">City</span>
                            <span className="font-medium">{watchedValues.city || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">GST Number</span>
                            <span className="font-medium">{watchedValues.gstNumber || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {watchedValues.createProject && (
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          First Project
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Project Name</span>
                            <span className="font-medium">{watchedValues.projectName || "—"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Start Date</span>
                            <span className="font-medium">{watchedValues.projectStartDate || "—"}</span>
                          </div>
                        </div>
                      </div>
                    )}
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
                
                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleSubmit}
                    disabled={createClientMutation.isPending}
                    className="bg-gradient-to-r from-primary to-emerald-500"
                  >
                    {createClientMutation.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Complete Onboarding
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


