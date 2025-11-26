import { useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TeamMemberDialogProps {
  member?: TeamMember | null;
  open: boolean;
  onClose: () => void;
}

export function TeamMemberDialog({ member, open, onClose }: TeamMemberDialogProps) {
  const { toast } = useToast();

  const { data: jobRoles = [] } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles", { status: "ACTIVE" }],
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
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        roleTitle: member.roleTitle,
        employmentType: member.employmentType || "FULL_TIME",
        status: member.status,
        baseSalary: Number(member.baseSalary),
        joinedDate: member.joinedDate ? new Date(member.joinedDate).toISOString().split("T")[0] : "",
        exitDate: member.exitDate ? new Date(member.exitDate).toISOString().split("T")[0] : null,
        notes: member.notes || "",
      });
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
      });
    }
  }, [member, form]);

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
      return apiRequest("PUT", `/api/team-members/${member?.id}`, data);
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

  const onSubmit = (data: InsertTeamMember) => {
    if (member) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {member ? "Edit Team Member" : "Add Team Member"}
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
                {isPending ? "Saving..." : member ? "Update Member" : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
