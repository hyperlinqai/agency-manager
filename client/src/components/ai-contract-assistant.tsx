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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Bot,
  AlertCircle,
} from "lucide-react";

interface AIProvider {
  openai: boolean;
  gemini: boolean;
}

interface AIContractAssistantProps {
  onApplyGeneratedContent: (content: {
    scopeOfWork?: string;
    deliverables?: string[];
    termsAndConditions?: string;
    confidentialityClause?: string;
    terminationClause?: string;
  }) => void;
}

export function AIContractAssistant({
  onApplyGeneratedContent,
}: AIContractAssistantProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "gemini">("openai");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI Generation form state
  const [clientName, setClientName] = useState("");
  const [services, setServices] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Fetch available AI providers
  const { data: providers } = useQuery<AIProvider>({
    queryKey: ["/api/ai/providers"],
    enabled: open,
  });

  // Generate contract content
  const generateMutation = useMutation({
    mutationFn: async () => {
      const serviceList = services.split(",").map((s) => s.trim()).filter(Boolean);
      return apiRequest("POST", "/api/ai/generate-contract", {
        provider: selectedProvider,
        clientName: clientName || "Client",
        services: serviceList.length > 0 ? serviceList : ["Digital Marketing Services"],
        contractValue: parseFloat(contractValue) || 0,
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate,
        paymentTerms,
        additionalContext,
      });
    },
    onSuccess: (result: { success: boolean; content?: string; error?: string }) => {
      if (result.success && result.content) {
        setGeneratedContent(result.content);
        toast({
          title: "Content generated!",
          description: "AI has generated contract content. Review and apply it to your contract.",
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

  const parseAndApplyContent = () => {
    if (!generatedContent) return;

    // Extract different sections from generated content
    const scopeMatch = generatedContent.match(/(?:Scope of Work|##\s*Scope of Work)([\s\S]*?)(?=##|\*\*Deliverables|\*\*Terms|$)/i);
    const deliverablesMatch = generatedContent.match(/(?:Deliverables|##\s*Deliverables)([\s\S]*?)(?=##|\*\*Terms|\*\*Confidentiality|$)/i);
    const termsMatch = generatedContent.match(/(?:Terms and Conditions|##\s*Terms and Conditions|General Terms)([\s\S]*?)(?=##|\*\*Confidentiality|\*\*Termination|$)/i);
    const confidentialityMatch = generatedContent.match(/(?:Confidentiality|##\s*Confidentiality)([\s\S]*?)(?=##|\*\*Termination|$)/i);
    const terminationMatch = generatedContent.match(/(?:Termination|##\s*Termination)([\s\S]*?)(?=##|$)/i);

    // Extract deliverables as array
    const deliverables: string[] = [];
    if (deliverablesMatch) {
      const deliverableText = deliverablesMatch[1];
      const bulletPoints = deliverableText.match(/[-•*]\s*(.+)/g);
      if (bulletPoints) {
        bulletPoints.forEach((point) => {
          const cleaned = point.replace(/^[-•*]\s*/, "").trim();
          if (cleaned) deliverables.push(cleaned);
        });
      }
    }

    onApplyGeneratedContent({
      scopeOfWork: scopeMatch ? scopeMatch[1].trim() : undefined,
      deliverables: deliverables.length > 0 ? deliverables : undefined,
      termsAndConditions: termsMatch ? termsMatch[1].trim() : undefined,
      confidentialityClause: confidentialityMatch ? confidentialityMatch[1].trim() : undefined,
      terminationClause: terminationMatch ? terminationMatch[1].trim() : undefined,
    });

    toast({
      title: "Content applied!",
      description: "Generated content has been added to your contract.",
    });
    setOpen(false);
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Contract Assistant
          </DialogTitle>
          <DialogDescription>
            Generate professional contract content with AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
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
                  <Label>Contract Value (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Services (comma-separated)</Label>
                  <Input
                    placeholder="e.g., Social Media Management, SEO, Content Marketing"
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Payment Terms</Label>
                  <Input
                    placeholder="e.g., 50% advance, 50% on completion"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Additional Context (optional)</Label>
                  <Textarea
                    placeholder="Any specific requirements or special terms..."
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
                    Generate Contract Content
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
                      <Button variant="ghost" size="sm" onClick={handleCopyContent}>
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
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
                      <Button onClick={parseAndApplyContent}>
                        <Check className="h-4 w-4 mr-2" />
                        Apply to Contract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
