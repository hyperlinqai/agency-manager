import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertTeamMemberSchema, type InsertTeamMember, type TeamMember, type JobRole } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link2, Copy, ExternalLink, RefreshCw, MessageSquare, User, Check } from "lucide-react";
import type { SlackSettings } from "@shared/schema";

interface TeamMemberDialogProps {
  member?: TeamMember | null;
  open: boolean;
  onClose: () => void;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    display_name?: string;
  };
}

export function TeamMemberDialog({ member, open, onClose }: TeamMemberDialogProps) {
  const { toast } = useToast();
  const [regeneratingToken, setRegeneratingToken] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null | undefined>(member);
  const [selectedSlackUserId, setSelectedSlackUserId] = useState<string | null>(null);

  const { data: jobRoles = [] } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles", { status: "ACTIVE" }],
  });

  // Check if Slack is configured
  const { data: slackSettings } = useQuery<SlackSettings | null>({
    queryKey: ["/api/slack/settings"],
  });

  // Fetch Slack users if Slack is configured
  const { data: slackUsers = [], isLoading: loadingSlackUsers } = useQuery<SlackUser[]>({
    queryKey: ["/api/slack/users"],
    enabled: !!slackSettings?.teamId,
  });

  const form = useForm<InsertTeamMember>({
    resolver: zodResolver(insertTeamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      roleTitle: "",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      baseSalary: 0,
      joinedDate: new Date().toISOString().split("T")[0],
      exitDate: null,
      notes: "",
      slackUserId: null,
    },
  });

  // Update currentMember when member prop changes
  useEffect(() => {
    setCurrentMember(member);
  }, [member]);

  useEffect(() => {
    if (currentMember) {
      form.reset({
        name: currentMember.name,
        email: currentMember.email,
        roleTitle: currentMember.roleTitle,
        employmentType: currentMember.employmentType || "FULL_TIME",
        status: currentMember.status,
        baseSalary: Number(currentMember.baseSalary),
        joinedDate: currentMember.joinedDate ? new Date(currentMember.joinedDate).toISOString().split("T")[0] : "",
        exitDate: currentMember.exitDate ? new Date(currentMember.exitDate).toISOString().split("T")[0] : null,
        notes: currentMember.notes || "",
        slackUserId: currentMember.slackUserId || null,
      });
      setSelectedSlackUserId(currentMember.slackUserId || null);
    } else {
      form.reset({
        name: "",
        email: "",
        roleTitle: "",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        baseSalary: 0,
        joinedDate: new Date().toISOString().split("T")[0],
        exitDate: null,
        notes: "",
        slackUserId: null,
      });
      setSelectedSlackUserId(null);
    }
  }, [currentMember, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertTeamMember) => {
      return apiRequest("POST", "/api/team-members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({ title: "Team member created successfully" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTeamMember) => {
      return apiRequest("PUT", `/api/team-members/${currentMember?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({ title: "Team member updated successfully" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: async () => {
      if (!currentMember?.id) throw new Error("Member ID is required");
      console.log("Regenerating token for team member:", currentMember.id);
      const response = await apiRequest("POST", `/api/team-members/${currentMember.id}/regenerate-token`);
      console.log("Token regeneration response:", response);
      return response;
    },
    onSuccess: async (data) => {
      console.log("Token regeneration success, data:", data);

      // Use the token directly from the regenerate response - this is the most reliable source
      const newToken = data.onboardingToken;
      console.log("New token from API:", newToken);

      if (newToken && currentMember) {
        // Update the local member state with the new token immediately
        setCurrentMember({
          ...currentMember,
          onboardingToken: newToken,
        });
      }

      // Invalidate queries to refresh the list in the background
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });

      toast({
        title: currentMember?.onboardingToken ? "Token regenerated" : "Token generated",
        description: "Onboarding link has been created. You can now share it with the team member."
      });
      setRegeneratingToken(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setRegeneratingToken(false);
    },
  });

  const handleRegenerateToken = () => {
    setRegeneratingToken(true);
    regenerateTokenMutation.mutate();
  };

  const onboardingUrl = currentMember?.onboardingToken 
    ? `${window.location.origin}/team-onboarding/${currentMember.onboardingToken}`
    : "";

  const handleCopyLink = () => {
    if (onboardingUrl) {
      navigator.clipboard.writeText(onboardingUrl);
      toast({ title: "Link copied!", description: "Onboarding link copied to clipboard" });
    }
  };

  const onSubmit = (data: InsertTeamMember) => {
    if (currentMember) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {currentMember ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roleTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role/Title</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobRoles.length > 0 ? (
                          jobRoles.map((role) => (
                            <SelectItem key={role.id} value={role.title}>
                              {role.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            No job roles available. Add them in Settings.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employment-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="FREELANCE">Freelance</SelectItem>
                        <SelectItem value="INTERN">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary (Monthly)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-salary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="joinedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joined Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={typeof field.value === "string" ? field.value : (field.value ? new Date(field.value).toISOString().split("T")[0] : "")}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        data-testid="input-joined-date" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? (typeof field.value === "string" ? field.value : new Date(field.value).toISOString().split("T")[0]) : ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        onBlur={field.onBlur}
                        data-testid="input-exit-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Onboarding Link Section - Only show for existing members */}
            {currentMember && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    Team Member Onboarding Link
                  </CardTitle>
                  <CardDescription>
                    Share this link with the team member to collect their information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {onboardingUrl ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-background rounded-lg border px-3 py-2 text-sm font-mono truncate">
                          {onboardingUrl}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(onboardingUrl, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleRegenerateToken}
                          disabled={regeneratingToken}
                        >
                          <RefreshCw className={`h-4 w-4 ${regeneratingToken ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={(currentMember as any).onboardingCompleted ? "default" : "secondary"}>
                            {(currentMember as any).onboardingCompleted ? "Submitted" : "Pending"}
                          </Badge>
                        </div>
                        {(currentMember as any).onboardingCompletedAt && (
                          <span className="text-muted-foreground">
                            Submitted on {new Date((currentMember as any).onboardingCompletedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        No onboarding token available. Generate one to create a shareable onboarding link.
                      </div>
                      <Button
                        variant="default"
                        onClick={handleRegenerateToken}
                        disabled={regeneratingToken}
                        className="w-full"
                      >
                        {regeneratingToken ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2" />
                            Generate Onboarding Link
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Slack Integration Section - Only show if Slack is configured */}
            {slackSettings?.teamId && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-[#4A154B]/5 to-[#4A154B]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#4A154B]" />
                    Slack Attendance Tracking
                  </CardTitle>
                  <CardDescription>
                    Connect to Slack for automatic attendance monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="slackUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slack Account</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value === "none" ? null : value);
                            setSelectedSlackUserId(value === "none" ? null : value);
                          }}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingSlackUsers ? "Loading Slack users..." : "Select Slack user"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Not connected</span>
                            </SelectItem>
                            {slackUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span>{user.real_name || user.name}</span>
                                  {user.profile.email && (
                                    <span className="text-muted-foreground text-xs">
                                      ({user.profile.email})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-2">
                          {field.value ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Check className="h-3 w-3" />
                              Slack attendance tracking enabled for this member
                            </span>
                          ) : (
                            "Link a Slack account to track attendance via morning updates and end-of-day messages"
                          )}
                        </p>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? "Saving..." : currentMember ? "Update Member" : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
