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
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileSignature,
  Calendar,
  DollarSign,
  FileText,
  Sparkles,
} from "lucide-react";
import { AIContractAssistant } from "@/components/ai-contract-assistant";
import type { Client, ProposalWithRelations } from "@shared/schema";

const contractFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  proposalId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  
  scopeOfWork: z.string().min(1, "Scope of work is required"),
  deliverables: z.array(z.string()),
  
  contractValue: z.number().min(0, "Contract value must be positive"),
  currency: z.string().default("INR"),
  paymentTerms: z.string().optional(),
  
  termsAndConditions: z.string().optional(),
  confidentialityClause: z.string().optional(),
  terminationClause: z.string().optional(),
  
  notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

export default function ContractCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newDeliverable, setNewDeliverable] = useState("");

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: proposals } = useQuery<ProposalWithRelations[]>({
    queryKey: ["/api/proposals", { status: "ACCEPTED" }],
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientId: "",
      proposalId: "",
      title: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      scopeOfWork: "",
      deliverables: [],
      contractValue: 0,
      currency: "INR",
      paymentTerms: "",
      termsAndConditions: `1. Payment Terms: As specified in this contract.
2. Intellectual Property: All work created remains the property of the client upon full payment.
3. Confidentiality: Both parties agree to maintain confidentiality of all proprietary information.
4. Revisions: Includes up to 2 rounds of revisions per deliverable.
5. Timeline: Delivery dates are estimates and may vary based on client feedback timing.`,
      confidentialityClause: `Both parties agree to keep confidential all proprietary information, trade secrets, and business information disclosed during the engagement. This obligation survives the termination of this agreement.`,
      terminationClause: `Either party may terminate this agreement with 30 days written notice. Upon termination, the client shall pay for all work completed up to the termination date.`,
      notes: "",
    },
  });

  const { fields: deliverableFields, append: appendDeliverable, remove: removeDeliverable } = useFieldArray({
    control: form.control,
    name: "deliverables",
  });

  const watchedClientId = form.watch("clientId");
  const deliverables = form.watch("deliverables");
  const clientProposals = proposals?.filter(p => p.clientId === watchedClientId);

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      return apiRequest("POST", "/api/contracts", {
        ...data,
        status: "DRAFT",
      });
    },
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract created!",
        description: `Contract "${contract.title}" has been created successfully.`,
      });
      setLocation(`/contracts/${contract.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      appendDeliverable(newDeliverable.trim());
      setNewDeliverable("");
    }
  };

  const handleProposalSelect = (proposalId: string) => {
    const proposal = proposals?.find(p => p.id === proposalId);
    if (proposal) {
      form.setValue("proposalId", proposalId);
      form.setValue("title", `Contract for ${proposal.title}`);
      form.setValue("contractValue", proposal.totalAmount);
      
      // Set scope from services
      const scopeLines = proposal.services?.map(s => `• ${s.name}: ${s.description}`).join("\n") || "";
      form.setValue("scopeOfWork", scopeLines);
      
      // Set deliverables from services
      const deliverables = proposal.services?.flatMap(s => s.deliverables || []) || [];
      form.setValue("deliverables", deliverables);
    }
  };

  const onSubmit = (data: ContractFormData) => {
    createContractMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contracts">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Contract</h1>
            <p className="text-sm text-muted-foreground">
              Create a new client contract with scope and terms
            </p>
          </div>
        </div>
        <AIContractAssistant
          onApplyGeneratedContent={(content) => {
            if (content.scopeOfWork) {
              form.setValue("scopeOfWork", content.scopeOfWork);
            }
            if (content.deliverables && content.deliverables.length > 0) {
              // Clear existing deliverables and add new ones
              form.setValue("deliverables", content.deliverables);
            }
            if (content.termsAndConditions) {
              form.setValue("termsAndConditions", content.termsAndConditions);
            }
            if (content.confidentialityClause) {
              form.setValue("confidentialityClause", content.confidentialityClause);
            }
            if (content.terminationClause) {
              form.setValue("terminationClause", content.terminationClause);
            }
          }}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Client & Basic Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSignature className="h-5 w-5 text-primary" />
                Contract Details
              </CardTitle>
              <CardDescription>
                Basic contract information and client selection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {watchedClientId && clientProposals && clientProposals.length > 0 && (
                  <FormField
                    control={form.control}
                    name="proposalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Proposal (Optional)</FormLabel>
                        <Select onValueChange={handleProposalSelect} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Import from accepted proposal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientProposals.map((proposal) => (
                              <SelectItem key={proposal.id} value={proposal.id}>
                                {proposal.title} - {proposal.proposalNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Digital Marketing Services Agreement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Timeline & Value */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-primary" />
                Timeline & Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
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
                  name="contractValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Value (₹) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
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
                        placeholder="e.g., 50% advance, 25% at mid-point, 25% on completion"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Scope & Deliverables */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Scope & Deliverables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scopeOfWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope of Work *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the scope of work in detail..."
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Deliverables</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add a deliverable..."
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDeliverable())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddDeliverable}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {deliverableFields.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {deliverableFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <FormField
                          control={form.control}
                          name={`deliverables.${index}`}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...inputField}
                                  className="text-sm bg-background"
                                  placeholder="Deliverable item"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeDeliverable(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-primary" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Terms</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confidentialityClause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confidentiality Clause</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terminationClause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termination Clause</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes (not visible to client)"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/contracts">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={createContractMutation.isPending}
              className="bg-gradient-to-r from-primary to-emerald-500"
            >
              {createContractMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

