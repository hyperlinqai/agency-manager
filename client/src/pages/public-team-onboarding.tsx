import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { ArrowLeft, ArrowRight, Check, User, Briefcase, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const teamOnboardingSchema = z.object({
  // Step 1: Personal Info
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  personalEmail: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  
  // Step 2: Additional Details
  department: z.string().optional(),
  reportingTo: z.string().optional(),
  
  // Step 3: Documents & Banking
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  panNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  notes: z.string().optional(),
});

type TeamOnboardingData = z.infer<typeof teamOnboardingSchema>;

const steps = [
  { id: 1, title: "Personal Info", description: "Contact details", icon: User },
  { id: 2, title: "Employment", description: "Department & reporting", icon: Briefcase },
  { id: 3, title: "Documents", description: "Bank & ID info", icon: FileText },
  { id: 4, title: "Review", description: "Confirm & complete", icon: CheckCircle2 },
];

const DEPARTMENTS = [
  "Design",
  "Development",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "HR",
  "Content",
  "Management",
];

interface TeamMemberInfo {
  teamMemberId: string;
  name: string;
  email: string;
  roleTitle: string;
  onboardingCompleted: boolean;
}

interface PublicTeamOnboardingPageProps {
  token?: string;
}

export default function PublicTeamOnboardingPage({ token }: PublicTeamOnboardingPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debug logging
  console.log("PublicTeamOnboardingPage mounted, token:", token);

  // Fetch team member info
  const { data: memberInfo, isLoading: memberLoading, error: memberError } = useQuery<TeamMemberInfo>({
    queryKey: ["/api/public/team-onboarding", token],
    queryFn: async () => {
      if (!token) {
        throw new Error("No token provided");
      }
      // Ensure token is properly encoded in URL
      const encodedToken = encodeURIComponent(token);
      const url = `/api/public/team-onboarding/${encodedToken}`;
      console.log("Fetching team member with URL:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Invalid onboarding link" }));
        console.error("Failed to fetch team member:", errorData);
        throw new Error(errorData.error || "Invalid onboarding link");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false, // Don't retry on 404
  });

  // Fetch existing onboarding data
  const { data: existingData, isLoading: dataLoading } = useQuery<TeamOnboardingData>({
    queryKey: ["/api/public/team-onboarding-data", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/team-onboarding/${token}/data`);
      if (!res.ok) {
        // If no data exists yet, return empty object
        if (res.status === 404) return {};
        throw new Error("Failed to fetch onboarding data");
      }
      return res.json();
    },
    enabled: !!token && !!memberInfo,
  });

  const form = useForm<TeamOnboardingData>({
    resolver: zodResolver(teamOnboardingSchema),
    defaultValues: {
      phone: "",
      dateOfBirth: "",
      personalEmail: "",
      emergencyContact: "",
      emergencyPhone: "",
      department: "",
      reportingTo: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      panNumber: "",
      bankAccountNumber: "",
      bankName: "",
      ifscCode: "",
      notes: "",
    },
  });

  // Update form when existing data loads
  useEffect(() => {
    if (existingData) {
      form.reset({
        phone: existingData.phone || "",
        dateOfBirth: existingData.dateOfBirth || "",
        personalEmail: existingData.personalEmail || "",
        emergencyContact: existingData.emergencyContact || "",
        emergencyPhone: existingData.emergencyPhone || "",
        department: existingData.department || "",
        reportingTo: existingData.reportingTo || "",
        address: existingData.address || "",
        city: existingData.city || "",
        state: existingData.state || "",
        pincode: existingData.pincode || "",
        panNumber: existingData.panNumber || "",
        bankAccountNumber: existingData.bankAccountNumber || "",
        bankName: existingData.bankName || "",
        ifscCode: existingData.ifscCode || "",
        notes: existingData.notes || "",
      });
    }
  }, [existingData, form]);

  // Save progress mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TeamOnboardingData) => {
      const res = await fetch(`/api/public/team-onboarding/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/team-onboarding-data", token] });
      toast({
        title: "Progress Saved",
        description: "Your information has been saved. You can continue later.",
      });
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      // First save the data
      await saveMutation.mutateAsync(form.getValues());
      
      // Then submit
      const res = await fetch(`/api/public/team-onboarding/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to submit onboarding");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Onboarding Submitted!",
        description: "Thank you for completing the onboarding process.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/public/team-onboarding", token] });
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
    if (currentStep < steps.length) {
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

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  if (memberLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-96 text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading onboarding form...</p>
        </Card>
      </div>
    );
  }

  if (memberError || !memberInfo) {
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

  if (memberInfo.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-96 text-center p-8">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-semibold mt-4">Onboarding Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            Thank you, {memberInfo.name}! Your onboarding information has been submitted successfully.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Our team will review your information and get in touch soon.
          </p>
        </Card>
      </div>
    );
  }

  const watchedValues = form.watch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Team Member Onboarding</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {memberInfo.name} - {memberInfo.roleTitle}
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
              <span>Step {currentStep} of {steps.length}</span>
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
            {steps.map((step) => {
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
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Please provide your personal contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="personalEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.personal@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe (Spouse)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 98765 43211" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Employment Details */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Employment Details
                  </CardTitle>
                  <CardDescription>
                    Additional employment information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
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
                      name="reportingTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting To</FormLabel>
                          <FormControl>
                            <Input placeholder="Manager's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Documents & Bank Info */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Documents & Banking
                  </CardTitle>
                  <CardDescription>
                    ID documents and bank account details for payroll (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Address</h4>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main Street, Apt 4B" {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
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
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-4">ID Documents</h4>
                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <Input placeholder="ABCDE1234F" {...field} className="uppercase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-4">Bank Account (for Salary)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="HDFC Bank" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="ifscCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IFSC Code</FormLabel>
                            <FormControl>
                              <Input placeholder="HDFC0001234" {...field} className="uppercase" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional information..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <Card>
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
                        Personal Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium">{watchedValues.phone || "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Date of Birth</span>
                          <span className="font-medium">{watchedValues.dateOfBirth || "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Personal Email</span>
                          <span className="font-medium">{watchedValues.personalEmail || "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Emergency Contact</span>
                          <span className="font-medium">{watchedValues.emergencyContact || "—"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Employment Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Department</span>
                          <span className="font-medium">{watchedValues.department || "—"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Reporting To</span>
                          <span className="font-medium">{watchedValues.reportingTo || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(watchedValues.panNumber || watchedValues.bankAccountNumber) && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Documents & Banking
                      </h3>
                      <div className="space-y-2 text-sm">
                        {watchedValues.panNumber && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">PAN Number</span>
                            <span className="font-medium font-mono">{watchedValues.panNumber}</span>
                          </div>
                        )}
                        {watchedValues.bankName && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-medium">{watchedValues.bankName}</span>
                          </div>
                        )}
                        {watchedValues.bankAccountNumber && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Account</span>
                            <span className="font-medium font-mono">
                              ****{watchedValues.bankAccountNumber.slice(-4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-800">Ready to Submit</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      By submitting, you confirm that the information provided is accurate. Our team will review your details.
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
                        <CheckCircle2 className="h-4 w-4 mr-2" />
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
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < steps.length && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

