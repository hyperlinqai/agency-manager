import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Users, DollarSign, Trash2, UserPlus, Link2, Copy, ExternalLink } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamMemberDialog } from "@/components/team-member-dialog";
import { SalaryPaymentDialog } from "@/components/salary-payment-dialog";
import { MarkSalaryPaidDialog } from "@/components/mark-salary-paid-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TeamMember, SalaryPayment } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamSalariesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  // Parse tab from URL query params
  const getTabFromUrl = () => {
    const params = new URLSearchParams(searchString);
    const tab = params.get("tab");
    return tab === "salaries" ? "salaries" : "team";
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  // Sync tab state when URL changes
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [searchString]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "salaries") {
      setLocation("/team-salaries?tab=salaries");
    } else {
      setLocation("/team-salaries");
    }
  };
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingSalary, setEditingSalary] = useState<SalaryPayment | null>(null);
  const [markingPaidSalary, setMarkingPaidSalary] = useState<SalaryPayment | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [deletingSalary, setDeletingSalary] = useState<SalaryPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [salaryStatusFilter, setSalaryStatusFilter] = useState("");

  const { data: teamMembers = [], isLoading: loadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members", { status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const { data: salaries = [], isLoading: loadingSalaries } = useQuery<SalaryPayment[]>({
    queryKey: ["/api/salaries", { status: salaryStatusFilter === "all" ? undefined : salaryStatusFilter }],
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/team-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({ title: "Success", description: "Team member deleted successfully" });
      setDeletingMember(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/salaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      toast({ title: "Success", description: "Salary record deleted successfully" });
      setDeletingSalary(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowTeamDialog(true);
  };

  const handleCloseTeamDialog = () => {
    setShowTeamDialog(false);
    setEditingMember(null);
  };

  const handleEditSalary = (salary: SalaryPayment) => {
    setEditingSalary(salary);
    setShowSalaryDialog(true);
  };

  const handleCloseSalaryDialog = () => {
    setShowSalaryDialog(false);
    setEditingSalary(null);
  };

  const handleMarkPaid = (salary: SalaryPayment) => {
    setMarkingPaidSalary(salary);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSalaryStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTeamMemberName = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    return member?.name || "Unknown";
  };

  const totalSalaryPaid = salaries
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalSalaryPending = salaries
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Team & Salaries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members and salary payments
          </p>
        </div>
        <Link href="/employee-onboarding">
          <Button variant="outline" data-testid="button-employee-onboarding">
            <UserPlus className="h-4 w-4 mr-2" />
            Onboard Employee
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="salaries" data-testid="tab-salaries">
            <DollarSign className="h-4 w-4 mr-2" />
            Salary Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowTeamDialog(true)} data-testid="button-add-member">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>

          {loadingTeam ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading team members...</div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Email
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Base Salary
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Joined Date
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Onboarding
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                          No team members found. Click "Add Team Member" to create one.
                        </td>
                      </tr>
                    ) : (
                      teamMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b hover-elevate active-elevate-2 cursor-pointer"
                          onClick={() => handleEditMember(member)}
                          data-testid={`member-row-${member.id}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm" data-testid={`member-name-${member.id}`}>
                              {member.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm" data-testid={`member-role-${member.id}`}>
                              {member.roleTitle}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" data-testid={`member-type-${member.id}`}>
                              {member.employmentType?.replace("_", " ") || "Full Time"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm" data-testid={`member-email-${member.id}`}>
                              {member.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium tabular-nums" data-testid={`member-salary-${member.id}`}>
                              {formatCurrency(Number(member.baseSalary))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm" data-testid={`member-joined-${member.id}`}>
                              {formatDate(member.joinedDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={getStatusBadgeVariant(member.status)}
                              data-testid={`member-status-${member.id}`}
                            >
                              {member.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            {(member as any).onboardingToken ? (
                              <div className="flex items-center gap-1">
                                <Badge variant={(member as any).onboardingCompleted ? "default" : "secondary"}>
                                  {(member as any).onboardingCompleted ? "Done" : "Pending"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    const url = `${window.location.origin}/team-onboarding/${(member as any).onboardingToken}`;
                                    navigator.clipboard.writeText(url);
                                    toast({ title: "Link copied!", description: url });
                                  }}
                                  title="Copy onboarding link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    window.open(`/team-onboarding/${(member as any).onboardingToken}`, "_blank");
                                  }}
                                  title="Open onboarding link"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No link</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMember(member)}
                                data-testid={`button-edit-${member.id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingMember(member)}
                                data-testid={`button-delete-${member.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="salaries" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Total Paid</div>
              <div className="text-2xl font-semibold mt-1 text-green-600" data-testid="total-paid">
                {formatCurrency(totalSalaryPaid)}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-semibold mt-1 text-orange-600" data-testid="total-pending">
                {formatCurrency(totalSalaryPending)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <Select value={salaryStatusFilter} onValueChange={setSalaryStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-salary-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowSalaryDialog(true)} data-testid="button-add-salary">
              <Plus className="h-4 w-4 mr-2" />
              Record Salary Payment
            </Button>
          </div>

          {loadingSalaries ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading salaries...</div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Team Member
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Month
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Payment Date
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          No salary records found. Click "Record Salary Payment" to create one.
                        </td>
                      </tr>
                    ) : (
                      salaries.map((salary) => (
                        <tr
                          key={salary.id}
                          className="border-b hover-elevate active-elevate-2 cursor-pointer"
                          onClick={() => handleEditSalary(salary)}
                          data-testid={`salary-row-${salary.id}`}
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm" data-testid={`salary-member-${salary.id}`}>
                              {getTeamMemberName(salary.teamMemberId)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm" data-testid={`salary-month-${salary.id}`}>
                              {salary.month}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium tabular-nums" data-testid={`salary-amount-${salary.id}`}>
                              {formatCurrency(Number(salary.amount))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm" data-testid={`salary-date-${salary.id}`}>
                              {salary.paymentDate ? formatDate(salary.paymentDate) : "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={getSalaryStatusBadgeVariant(salary.status)}
                              data-testid={`salary-status-${salary.id}`}
                            >
                              {salary.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSalary(salary)}
                                data-testid={`button-edit-${salary.id}`}
                              >
                                Edit
                              </Button>
                              {salary.status !== "PAID" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkPaid(salary)}
                                  data-testid={`button-mark-paid-${salary.id}`}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingSalary(salary)}
                                data-testid={`button-delete-salary-${salary.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showTeamDialog && (
        <TeamMemberDialog
          member={editingMember}
          open={showTeamDialog}
          onClose={handleCloseTeamDialog}
        />
      )}

      {showSalaryDialog && (
        <SalaryPaymentDialog
          salary={editingSalary}
          open={showSalaryDialog}
          onClose={handleCloseSalaryDialog}
        />
      )}

      {markingPaidSalary && (
        <MarkSalaryPaidDialog
          salary={markingPaidSalary}
          open={!!markingPaidSalary}
          onClose={() => setMarkingPaidSalary(null)}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        onConfirm={() => deletingMember && deleteMemberMutation.mutate(deletingMember.id)}
        title="Delete Team Member"
        itemName={deletingMember?.name}
        isLoading={deleteMemberMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletingSalary}
        onOpenChange={(open) => !open && setDeletingSalary(null)}
        onConfirm={() => deletingSalary && deleteSalaryMutation.mutate(deletingSalary.id)}
        title="Delete Salary Record"
        description={`Are you sure you want to delete the salary record for ${deletingSalary?.month}? This action cannot be undone.`}
        isLoading={deleteSalaryMutation.isPending}
      />
    </div>
  );
}
