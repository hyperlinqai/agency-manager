import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  FileText,
  Loader2,
  Wand2,
  Copy,
  Check,
  Bot,
  LayoutTemplate,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client } from "@shared/schema";

interface AIProvider {
  openai: boolean;
  gemini: boolean;
}

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  services: string[];
}

interface FullTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  services: string[];
  executiveSummary: string;
  defaultServices: Array<{
    serviceType: string;
    name: string;
    description: string;
    deliverables: string[];
    kpis: string[];
    price: number;
    timeline: string;
  }>;
  termsAndConditions: string;
}

interface AIProposalAssistantProps {
  clients: Client[];
  onApplyTemplate: (template: FullTemplate) => void;
  onApplyGeneratedContent: (content: {
    executiveSummary?: string;
    termsAndConditions?: string;
  }) => void;
}

export function AIProposalAssistant({
  clients,
  onApplyTemplate,
  onApplyGeneratedContent,
}: AIProposalAssistantProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "generate">("templates");
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "gemini">("openai");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI Generation form state
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [services, setServices] = useState("");
  const [projectGoals, setProjectGoals] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Fetch available AI providers
  const { data: providers } = useQuery<AIProvider>({
    queryKey: ["/api/ai/providers"],
    enabled: open,
  });

  // Fetch proposal templates
  const { data: templates } = useQuery<ProposalTemplate[]>({
    queryKey: ["/api/ai/proposal-templates"],
    enabled: open,
  });

  // Fetch full template details
  const fetchTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("GET", `/api/ai/proposal-templates/${templateId}`);
    },
    onSuccess: (template: FullTemplate) => {
      onApplyTemplate(template);
      toast({
        title: "Template applied!",
        description: `"${template.name}" template has been loaded into your proposal.`,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate proposal content
  const generateMutation = useMutation({
    mutationFn: async () => {
      const serviceList = services.split(",").map((s) => s.trim()).filter(Boolean);
      return apiRequest("POST", "/api/ai/generate-proposal", {
        provider: selectedProvider,
        clientName: clientName || "Client",
        clientIndustry,
        services: serviceList.length > 0 ? serviceList : ["Digital Marketing"],
        projectGoals,
        budget,
        timeline,
        additionalContext,
      });
    },
    onSuccess: (result: { success: boolean; content?: string; error?: string }) => {
      if (result.success && result.content) {
        setGeneratedContent(result.content);
        toast({
          title: "Content generated!",
          description: "AI has generated proposal content. Review and apply it to your proposal.",
        });
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate content",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyContent = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Generated content copied to clipboard.",
      });
    }
  };

  const handleApplyContent = () => {
    if (generatedContent) {
      // Extract executive summary (first major section)
      const summaryMatch = generatedContent.match(/(?:Executive Summary|##\s*Executive Summary)([\s\S]*?)(?=##|\*\*[A-Z]|$)/i);
      const executiveSummary = summaryMatch ? summaryMatch[1].trim() : generatedContent.substring(0, 500);

      onApplyGeneratedContent({
        executiveSummary,
      });
      toast({
        title: "Content applied!",
        description: "Generated content has been added to your proposal.",
      });
      setOpen(false);
    }
  };

  const hasAnyProvider = providers?.openai || providers?.gemini;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Proposal Assistant
          </DialogTitle>
          <DialogDescription>
            Use templates or generate custom proposal content with AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "generate")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates?.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedTemplate === template.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {template.services.slice(0, 3).map((service) => (
                        <Badge key={service} variant="secondary" className="text-[10px]">
                          {service.replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {template.services.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{template.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemplate && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => fetchTemplateMutation.mutate(selectedTemplate)}
                  disabled={fetchTemplateMutation.isPending}
                >
                  {fetchTemplateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Use Template
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* AI Generate Tab */}
          <TabsContent value="generate" className="flex-1 overflow-auto mt-4 space-y-4">
            {!hasAnyProvider ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">No AI Providers Configured</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        To use AI generation, add your API keys in the .env file:
                      </p>
                      <code className="text-xs bg-amber-100 px-2 py-1 rounded mt-2 block">
                        OPENAI_API_KEY=your_key_here<br />
                        GEMINI_API_KEY=your_key_here
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Provider Selection */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">AI Provider:</Label>
                  <div className="flex gap-2">
                    {providers?.openai && (
                      <Button
                        variant={selectedProvider === "openai" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedProvider("openai")}
                      >
                        OpenAI (GPT-4)
                      </Button>
                    )}
                    {providers?.gemini && (
                      <Button
                        variant={selectedProvider === "gemini" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedProvider("gemini")}
                      >
                        Google Gemini
                      </Button>
                    )}
                  </div>
                </div>

                {/* Generation Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input
                      placeholder="e.g., Acme Corporation"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input
                      placeholder="e.g., E-commerce, Healthcare"
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Services (comma-separated)</Label>
                    <Input
                      placeholder="e.g., Social Media, SEO, Paid Ads"
                      value={services}
                      onChange={(e) => setServices(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Project Goals</Label>
                    <Textarea
                      placeholder="What does the client want to achieve?"
                      rows={2}
                      value={projectGoals}
                      onChange={(e) => setProjectGoals(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Range</Label>
                    <Input
                      placeholder="e.g., ₹50,000 - ₹1,00,000/month"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timeline</Label>
                    <Input
                      placeholder="e.g., 3 months, 6 months"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Additional Context (optional)</Label>
                    <Textarea
                      placeholder="Any specific requirements, challenges, or preferences..."
                      rows={2}
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating with {selectedProvider === "openai" ? "GPT-4" : "Gemini"}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Proposal Content
                    </>
                  )}
                </Button>

                {/* Generated Content */}
                {generatedContent && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          Generated Content
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCopyContent}>
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-60 overflow-auto bg-white rounded-md p-3 text-sm whitespace-pre-wrap border">
                        {generatedContent}
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCopyContent}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All
                        </Button>
                        <Button onClick={handleApplyContent}>
                          <Check className="h-4 w-4 mr-2" />
                          Apply to Proposal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
