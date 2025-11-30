import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Upload, FileText, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

interface UploadedFile {
  name: string;
  type: string;
  url: string;
  publicId: string;
  size: number;
  format: string;
}

export function UploadReportDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: UploadReportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [title, setTitle] = useState("");
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [notes, setNotes] = useState("");

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const response = await fetch("/api/upload/report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFile(data.file);
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedFile) throw new Error("No file uploaded");
      
      return apiRequest("POST", "/api/monthly-reports", {
        clientId,
        projectId: null,
        title: title || `${clientName} - ${reportMonth} Report`,
        status: "DRAFT",
        reportMonth,
        periodStart: new Date(`${reportMonth}-01`),
        periodEnd: new Date(new Date(`${reportMonth}-01`).setMonth(new Date(`${reportMonth}-01`).getMonth() + 1) - 1),
        executiveSummary: notes,
        highlights: [],
        challenges: [],
        recommendations: [],
        metrics: [],
        attachments: [
          {
            name: uploadedFile.name,
            type: uploadedFile.type as "PDF" | "DOC" | "PPT" | "EXCEL" | "IMAGE" | "OTHER",
            url: uploadedFile.url,
            size: uploadedFile.size,
            uploadedAt: new Date(),
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      toast({
        title: "Report saved",
        description: "Marketing report has been saved successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadFileMutation.mutateAsync(file);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setTitle("");
    setReportMonth(new Date().toISOString().slice(0, 7));
    setNotes("");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!uploadedFile) {
      toast({
        title: "No file",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }
    createReportMutation.mutate();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Marketing Report</DialogTitle>
          <DialogDescription>
            Upload a monthly marketing report for {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Report File *</Label>
            {!uploadedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  uploading 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                    <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, PPT, Excel (max 50MB)
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFile.type} • {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              placeholder={`${clientName} - Monthly Marketing Report`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Report Month *</Label>
            <Input
              id="month"
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this report..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!uploadedFile || createReportMutation.isPending}
          >
            {createReportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

