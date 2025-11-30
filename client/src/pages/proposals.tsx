import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ProposalPDF } from "@/components/proposal-pdf";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Copy,
  Download,
  Mail,
  Loader2,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { convertImageForPdf } from "@/lib/pdf-utils";
import type { ProposalWithRelations, CompanyProfile, Client } from "@shared/schema";

export default function ProposalsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingProposal, setDeletingProposal] = useState<ProposalWithRelations | null>(null);
  const [sendEmailDialog, setSendEmailDialog] = useState<ProposalWithRelations | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

  const { data: proposals, isLoading } = useQuery<ProposalWithRelations[]>({
    queryKey: ["/api/proposals", { status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const { data: companyProfile } = useQuery<CompanyProfile>({
    queryKey: ["/api/settings/company"],
    queryFn: async () => {
      return apiRequest("GET", "/api/settings/company");
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return apiRequest("DELETE", `/api/proposals/${proposalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Proposal deleted",
        description: "Proposal has been deleted successfully",
      });
      setDeletingProposal(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("POST", `/api/proposals/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Status updated",
        description: "Proposal status has been updated",
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

  // Helper to get client details
  const getClientForProposal = (proposal: ProposalWithRelations | null) => {
    if (!proposal) return null;
    return clients?.find(c => c.id === proposal.clientId);
  };

  // Download PDF function
  const handleDownloadPdf = async (proposal: ProposalWithRelations) => {
    try {
      setDownloadingPdf(proposal.id);
      const client = getClientForProposal(proposal);

      // Convert logo to PDF-compatible format (handles SVG, remote URLs, etc.)
      let logoForPdf = logoBase64;
      if (!logoForPdf && companyProfile?.logoUrl) {
        logoForPdf = await convertImageForPdf(companyProfile.logoUrl);
        if (logoForPdf) {
          setLogoBase64(logoForPdf); // Cache it for future use
        }
      }

      const blob = await pdf(
        <ProposalPDF
          proposal={proposal}
          companyProfile={companyProfile}
          clientName={client?.name || proposal.clientName}
          clientEmail={client?.email}
          clientAddress={client?.address}
          logoBase64={logoForPdf}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${proposal.proposalNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF downloaded",
        description: `${proposal.proposalNumber}.pdf has been downloaded`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Send email function
  const handleSendEmail = async () => {
    if (!sendEmailDialog) return;

    try {
      setSendingEmail(true);
      const client = getClientForProposal(sendEmailDialog);

      // Convert logo to PDF-compatible format (handles SVG, remote URLs, etc.)
      let logoForPdf = logoBase64;
      if (!logoForPdf && companyProfile?.logoUrl) {
        logoForPdf = await convertImageForPdf(companyProfile.logoUrl);
        if (logoForPdf) {
          setLogoBase64(logoForPdf); // Cache it for future use
        }
      }

      // Generate PDF as base64
      const blob = await pdf(
        <ProposalPDF
          proposal={sendEmailDialog}
          companyProfile={companyProfile}
          clientName={client?.name || sendEmailDialog.clientName}
          clientEmail={client?.email}
          clientAddress={client?.address}
          logoBase64={logoForPdf}
        />
      ).toBlob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const pdfBase64 = await base64Promise;

      // Send email via API
      await apiRequest("POST", `/api/proposals/${sendEmailDialog.id}/send-email`, {
        customMessage: emailMessage || undefined,
        pdfBase64,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Email sent",
        description: `Proposal sent to ${client?.email || "client"}`,
      });
      setSendEmailDialog(null);
      setEmailMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredProposals = proposals?.filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "SENT": return "bg-blue-100 text-blue-700";
      case "VIEWED": return "bg-purple-100 text-purple-700";
      case "ACCEPTED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage client proposals
          </p>
        </div>
        <Link href="/proposals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="VIEWED">Viewed</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Proposals</p>
            <p className="text-2xl font-bold">{proposals?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-blue-600">
              {proposals?.filter(p => p.status === "SENT" || p.status === "VIEWED").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-green-600">
              {proposals?.filter(p => p.status === "ACCEPTED").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(proposals?.reduce((sum, p) => sum + p.totalAmount, 0) || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredProposals || filteredProposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No proposals found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first proposal to get started
              </p>
              <Link href="/proposals/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Proposal
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Proposal #</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Valid Until</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Value</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => (
                  <TableRow 
                    key={proposal.id} 
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/proposals/${proposal.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium text-primary">
                      {proposal.proposalNumber}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {proposal.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {proposal.clientName}
                    </TableCell>
                    <TableCell>{formatDate(proposal.validUntil)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(proposal.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/proposals/${proposal.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {proposal.status === "DRAFT" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/proposals/${proposal.id}/edit`);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPdf(proposal);
                            }}
                            disabled={downloadingPdf === proposal.id}
                          >
                            {downloadingPdf === proposal.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSendEmailDialog(proposal);
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send via Email
                          </DropdownMenuItem>
                          {proposal.status === "DRAFT" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ id: proposal.id, status: "SENT" });
                            }}>
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // Duplicate logic here
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingProposal(proposal);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deletingProposal}
        onOpenChange={(open) => !open && setDeletingProposal(null)}
        onConfirm={() => deletingProposal && deleteMutation.mutate(deletingProposal.id)}
        title="Delete Proposal"
        itemName={deletingProposal?.title}
        isLoading={deleteMutation.isPending}
      />

      {/* Send Email Dialog */}
      <Dialog open={!!sendEmailDialog} onOpenChange={(open) => !open && setSendEmailDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Proposal via Email
            </DialogTitle>
            <DialogDescription>
              Send {sendEmailDialog?.proposalNumber} to {getClientForProposal(sendEmailDialog)?.email || "client"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium">{getClientForProposal(sendEmailDialog)?.email || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium truncate max-w-[200px]">
                  Proposal: {sendEmailDialog?.title}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attachment:</span>
                <span className="font-medium">{sendEmailDialog?.proposalNumber}.pdf</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailMessage">Personal Message (optional)</Label>
              <Textarea
                id="emailMessage"
                placeholder="Add a personal note to the client..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialog(null)} disabled={sendingEmail}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

