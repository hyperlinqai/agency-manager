import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import {
  Plus,
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type {
  LeaveRequestWithDetails,
  LeaveBalanceWithDetails,
  LeaveType,
  TeamMember,
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LeaveManagementPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  // Parse tab from URL
  const getTabFromUrl = () => {
    const params = new URLSearchParams(searchString);
    const tab = params.get("tab");
    return tab === "balances" ? "balances" : "requests";
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [searchString]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "balances") {
      setLocation("/leave-management?tab=balances");
    } else {
      setLocation("/leave-management");
    }
  };

  // Form state for new request
  const [formData, setFormData] = useState({
    teamMemberId: "",
    leaveTypeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    totalDays: 1,
    reason: "",
  });

  const { data: leaveRequestsData, isLoading: loadingRequests } = useQuery<LeaveRequestWithDetails[]>({
    queryKey: ["/api/leave-requests", {
      status: statusFilter === "all" ? undefined : statusFilter,
      teamMemberId: memberFilter === "all" ? undefined : memberFilter,
    }],
  });

  const { data: leaveBalancesData, isLoading: loadingBalances } = useQuery<LeaveBalanceWithDetails[]>({
    queryKey: ["/api/leave-balances", { year: new Date().getFullYear() }],
  });

  const { data: leaveTypesData } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave-types", { isActive: "true" }],
  });

  const { data: teamMembersData } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Ensure arrays are always valid
  const leaveRequests = Array.isArray(leaveRequestsData) ? leaveRequestsData : [];
  const leaveBalances = Array.isArray(leaveBalancesData) ? leaveBalancesData : [];
  const leaveTypes = Array.isArray(leaveTypesData) ? leaveTypesData : [];
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : [];

  // Check availability when form data changes
  const checkAvailabilityMutation = useMutation({
    mutationFn: async (data: { teamMemberId: string; leaveTypeId: string; totalDays: number; startDate: string }) => {
      return apiRequest("POST", "/api/leave-requests/check-availability", data);
    },
  });

  // Trigger availability check when relevant form fields change
  useEffect(() => {
    if (formData.teamMemberId && formData.leaveTypeId && formData.totalDays > 0 && showRequestDialog) {
      checkAvailabilityMutation.mutate({
        teamMemberId: formData.teamMemberId,
        leaveTypeId: formData.leaveTypeId,
        totalDays: formData.totalDays,
        startDate: formData.startDate,
      });
    }
  }, [formData.teamMemberId, formData.leaveTypeId, formData.totalDays, formData.startDate, showRequestDialog]);

  const availabilityInfo = checkAvailabilityMutation.data as {
    available: boolean;
    balance: number;
    pending: number;
    used: number;
    totalQuota: number;
    requestedDays: number;
    shortfall: number;
    leaveTypeName?: string;
    message: string;
  } | undefined;

  // Get member's current balances for display
  const selectedMemberBalances = useMemo(() => {
    if (!formData.teamMemberId) return [];
    return leaveBalances.filter(b => b.teamMemberId === formData.teamMemberId);
  }, [formData.teamMemberId, leaveBalances]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || errorData.error || "Failed to submit request");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"] });
      const balanceMsg = data.balanceInfo?.message ? ` ${data.balanceInfo.message}` : "";
      toast({ title: "Success", description: `Leave request submitted successfully.${balanceMsg}` });
      setShowRequestDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Insufficient Leave Balance", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/leave-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"] });
      toast({ title: "Success", description: "Leave request approved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("POST", `/api/leave-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"] });
      toast({ title: "Success", description: "Leave request rejected" });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/leave-requests/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"] });
      toast({ title: "Success", description: "Leave request cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/leave-requests/${id}`);
    },
    onSuccess: () => {
      // Invalidate all leave-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"], refetchType: "all" });
      toast({ title: "Success", description: "Leave request deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reinitializeAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/leave-balances/reinitialize-all");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"], refetchType: "all" });
      toast({ title: "Success", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      teamMemberId: "",
      leaveTypeId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      totalDays: 1,
      reason: "",
    });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const newFormData = { ...formData, [field]: value };
    const days = calculateDays(
      field === "startDate" ? value : formData.startDate,
      field === "endDate" ? value : formData.endDate
    );
    setFormData({ ...newFormData, totalDays: Math.max(1, days) });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "default";
      case "PENDING": return "secondary";
      case "REJECTED": return "destructive";
      case "CANCELLED": return "outline";
      default: return "outline";
    }
  };

  // Summary stats
  const stats = {
    totalRequests: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === "PENDING").length,
    approved: leaveRequests.filter(r => r.status === "APPROVED").length,
    rejected: leaveRequests.filter(r => r.status === "REJECTED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage leave requests, approvals, and balances
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Leave Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CalendarOff className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-950">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="requests">
            <Calendar className="h-4 w-4 mr-2" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger value="balances">
            <BarChart3 className="h-4 w-4 mr-2" />
            Leave Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardContent className="p-0">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading leave requests...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.memberName}</div>
                              <div className="text-xs text-muted-foreground">{request.memberEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.leaveTypeCode}</Badge>
                            <span className="ml-2 text-sm">{request.leaveTypeName}</span>
                          </TableCell>
                          <TableCell>{formatDate(request.startDate)}</TableCell>
                          <TableCell>{formatDate(request.endDate)}</TableCell>
                          <TableCell>{request.totalDays}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {request.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveMutation.mutate(request.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {request.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelMutation.mutate(request.id)}
                                disabled={cancelMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                            {/* Delete button - shown for all statuses */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Employee Leave Balances</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and manage leave balances for all employees
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => reinitializeAllMutation.mutate()}
                  disabled={reinitializeAllMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${reinitializeAllMutation.isPending ? "animate-spin" : ""}`} />
                  {reinitializeAllMutation.isPending ? "Recalculating..." : "Recalculate All Balances"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingBalances ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading leave balances...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead className="text-right">Total Quota</TableHead>
                      <TableHead className="text-right">Used</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Carry Forward</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No leave balances found. Balances are initialized when employees are created.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveBalances.map((balance) => (
                        <TableRow key={balance.id}>
                          <TableCell className="font-medium">{balance.memberName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{balance.leaveTypeCode}</Badge>
                            <span className="ml-2 text-sm">{balance.leaveTypeName}</span>
                          </TableCell>
                          <TableCell className="text-right">{balance.totalQuota}</TableCell>
                          <TableCell className="text-right text-red-600">{balance.used}</TableCell>
                          <TableCell className="text-right text-yellow-600">{balance.pending}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{balance.available}</TableCell>
                          <TableCell className="text-right">{balance.carryForward}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Leave Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Employee</Label>
              <Select
                value={formData.teamMemberId}
                onValueChange={(v) => setFormData({ ...formData, teamMemberId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type</Label>
              <Select
                value={formData.leaveTypeId}
                onValueChange={(v) => setFormData({ ...formData, leaveTypeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Total Days</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.totalDays}
                onChange={(e) => setFormData({ ...formData, totalDays: parseFloat(e.target.value) || 1 })}
              />
            </div>

            {/* Leave Balance Info */}
            {formData.teamMemberId && formData.leaveTypeId && (
              <div className="space-y-2">
                {checkAvailabilityMutation.isPending ? (
                  <div className="text-sm text-muted-foreground">Checking availability...</div>
                ) : availabilityInfo ? (
                  <Alert variant={availabilityInfo.available ? "default" : "destructive"}>
                    <div className="flex items-start gap-2">
                      {availabilityInfo.available ? (
                        <Info className="h-4 w-4 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription>
                          <div className="font-medium mb-1">
                            {availabilityInfo.leaveTypeName} Balance
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Total Quota:</span>
                              <span className="font-medium">{availabilityInfo.totalQuota} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Used:</span>
                              <span className="font-medium">{availabilityInfo.used} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pending Requests:</span>
                              <span className="font-medium">{availabilityInfo.pending} days</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 mt-1">
                              <span>Available:</span>
                              <span className={`font-bold ${availabilityInfo.available ? "text-green-600" : "text-red-600"}`}>
                                {availabilityInfo.balance} days
                              </span>
                            </div>
                            {!availabilityInfo.available && (
                              <div className="flex justify-between text-red-600">
                                <span>Shortfall:</span>
                                <span className="font-bold">{availabilityInfo.shortfall} days</span>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ) : null}
              </div>
            )}

            {/* Show all balances for selected member */}
            {formData.teamMemberId && selectedMemberBalances.length > 0 && !formData.leaveTypeId && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Leave Balances</div>
                <div className="space-y-1 text-sm">
                  {selectedMemberBalances.map((bal) => (
                    <div key={bal.id} className="flex justify-between">
                      <span>{bal.leaveTypeName} ({bal.leaveTypeCode})</span>
                      <span className="font-medium">{bal.available || 0} / {(bal.totalQuota || 0) + (bal.carryForward || 0)} days</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for leave"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRequestMutation.mutate(formData)}
              disabled={
                !formData.teamMemberId ||
                !formData.leaveTypeId ||
                !formData.reason ||
                createRequestMutation.isPending ||
                (availabilityInfo && !availabilityInfo.available)
              }
            >
              {createRequestMutation.isPending ? "Submitting..." :
               (availabilityInfo && !availabilityInfo.available) ? "Insufficient Balance" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting {selectedRequest?.memberName}'s leave request.
            </p>
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason })}
              disabled={!rejectionReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this leave request?
            </p>
            {selectedRequest && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee:</span>
                  <span className="font-medium">{selectedRequest.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leave Type:</span>
                  <span className="font-medium">{selectedRequest.leaveTypeName} ({selectedRequest.leaveTypeCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-medium">{formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days:</span>
                  <span className="font-medium">{selectedRequest.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>{selectedRequest.status}</Badge>
                </div>
              </div>
            )}
            <p className="text-sm text-destructive">
              This action cannot be undone. The leave balance will be recalculated.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && deleteMutation.mutate(selectedRequest.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
