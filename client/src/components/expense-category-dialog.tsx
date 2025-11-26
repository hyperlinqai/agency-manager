import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseCategory } from "@shared/schema";

const expenseCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10, "Code must be 10 characters or less"),
  group: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;

interface ExpenseCategoryDialogProps {
  category?: ExpenseCategory | null;
  open: boolean;
  onClose: () => void;
}

const CATEGORY_GROUPS = [
  "Operations",
  "Marketing & Sales",
  "Team & HR",
  "Client Project Costs",
  "Finance & Legal",
  "Travel & Communication",
  "Miscellaneous",
];

export function ExpenseCategoryDialog({ category, open, onClose }: ExpenseCategoryDialogProps) {
  const { toast } = useToast();
  const isEditing = !!category;

  const form = useForm<ExpenseCategoryFormData>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: "",
      code: "",
      group: "",
      description: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        code: category.code,
        group: (category as any).group || "",
        description: (category as any).description || "",
        status: (category as any).status || "ACTIVE",
      });
    } else {
      form.reset({
        name: "",
        code: "",
        group: "",
        description: "",
        status: "ACTIVE",
      });
    }
  }, [category, form]);

  const mutation = useMutation({
    mutationFn: async (data: ExpenseCategoryFormData) => {
      if (isEditing && category) {
        return apiRequest("PUT", `/api/expense-categories/${category.id}`, data);
      }
      return apiRequest("POST", "/api/expense-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      toast({
        title: isEditing ? "Category updated" : "Category created",
        description: isEditing
          ? "Expense category has been updated successfully"
          : "Expense category has been created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseCategoryFormData) => {
    mutation.mutate(data);
  };

  // Auto-generate code from name
  const handleNameChange = (name: string) => {
    if (!isEditing) {
      const code = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
      form.setValue("code", code);
    }
    form.setValue("name", name);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Expense Category" : "Add Expense Category"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Office Rent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., RENT"
                      className="uppercase"
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Short unique code for this category (max 10 chars)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Brief description of this category"
                      rows={2}
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

