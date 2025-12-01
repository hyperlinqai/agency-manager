import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ReportComparisonDialog } from "@/components/report-comparison-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Send,
  FileText,
  Download,
  GitCompare,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MonthlyReportWithRelations } from "@shared/schema";

export default function MonthlyReportsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingReport, setDeletingReport] = useState<MonthlyReportWithRelations | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [isComparing, setIsComparing] = useState(false);
  
  // Get clientId from URL if provided
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get("clientId");

  const { data: reports, isLoading } = useQuery<MonthlyReportWithRelations[]>({
    queryKey: ["/api/monthly-reports", { 
      status: statusFilter !== "all" ? statusFilter : undefined,
      clientId: clientIdFromUrl || undefined,
    }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest("DELETE", `/api/monthly-reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      toast({
        title: "Report deleted",
        description: "Monthly report has been deleted successfully",
      });
      setDeletingReport(null);
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
      return apiRequest("POST", `/api/monthly-reports/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
      toast({
        title: "Status updated",
        description: "Report status has been updated",
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

  const filteredReports = reports?.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports?.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports?.map(r => r.id) || []));
    }
  };

  const selectedReportsData = filteredReports?.filter(r => selectedReports.has(r.id)) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "PENDING_REVIEW": return "bg-yellow-100 text-yellow-700";
      case "APPROVED": return "bg-blue-100 text-blue-700";
      case "SENT": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage monthly marketing reports (PDF, DOC, PPT, Excel)
          </p>
        </div>
        <div className="flex gap-2">
          {selectedReports.size >= 2 && (
            <Button 
              variant="default"
              className="gap-2"
              onClick={() => setIsComparing(true)}
            >
              <GitCompare className="h-4 w-4" />
              Compare ({selectedReports.size})
            </Button>
          )}
          {selectedReports.size > 0 && (
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => setSelectedReports(new Set())}
            >
              <X className="h-4 w-4" />
              Clear Selection
            </Button>
          )}
          <Button 
            className="gap-2"
            onClick={() => {
              // TODO: Implement upload dialog
              alert("Report upload coming soon! For now, you can upload reports from individual client pages.");
            }}
          >
            <Plus className="h-4 w-4" />
            Upload Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Reports</p>
            <p className="text-2xl font-bold">{reports?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold text-gray-600">
              {reports?.filter(r => r.status === "DRAFT").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">
              {reports?.filter(r => r.status === "PENDING_REVIEW").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Sent</p>
            <p className="text-2xl font-bold text-green-600">
              {reports?.filter(r => r.status === "SENT").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredReports || filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No marketing reports uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload monthly marketing reports for your recurring marketing clients
              </p>
              <p className="text-xs text-muted-foreground/70 mt-4">
                Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredReports.length > 0 && selectedReports.size === filteredReports.length}
                      onCheckedChange={toggleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Report #</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Period</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Attachments</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow 
                    key={report.id} 
                    className={selectedReports.has(report.id) ? "bg-muted/50 hover:bg-muted/70 cursor-pointer" : "hover:bg-muted/30 cursor-pointer"}
                    onClick={() => navigate(`/monthly-reports/${report.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedReports.has(report.id)}
                        onCheckedChange={() => toggleReportSelection(report.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-primary">
                      {report.reportNumber}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {report.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.clientName}
                    </TableCell>
                    <TableCell>{report.reportMonth}</TableCell>
                    <TableCell>
                      {report.attachments && report.attachments.length > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {report.attachments.length}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.replace("_", " ")}
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
                            navigate(`/monthly-reports/${report.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {report.status === "DRAFT" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/monthly-reports/${report.id}/edit`);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {report.status === "APPROVED" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ id: report.id, status: "SENT" });
                            }}>
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // Download logic
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingReport(report);
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
        open={!!deletingReport}
        onOpenChange={(open) => !open && setDeletingReport(null)}
        onConfirm={() => deletingReport && deleteMutation.mutate(deletingReport.id)}
        title="Delete Report"
        itemName={deletingReport?.title}
        isLoading={deleteMutation.isPending}
      />

      <ReportComparisonDialog
        open={isComparing}
        onOpenChange={(open) => {
          setIsComparing(open);
          if (!open) {
            setSelectedReports(new Set());
          }
        }}
        reportIds={Array.from(selectedReports)}
      />
    </div>
  );
}

