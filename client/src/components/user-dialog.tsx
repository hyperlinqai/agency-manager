import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!user;
  const isAdmin = currentUser?.role === "ADMIN";

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STAFF",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "", // Don't pre-fill password
        role: user.role,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        role: data.role,
      };

      // Only include password if it's provided (for new users or when updating)
      if (data.password) {
        payload.password = data.password;
      }

      if (isEditing) {
        await apiRequest("PUT", `/api/users/${user.id}`, payload);
        toast({
          title: "User updated",
          description: "User has been updated successfully",
        });
      } else {
        // Password is required for new users
        if (!data.password) {
          form.setError("password", { message: "Password is required for new users" });
          setIsSubmitting(false);
          return;
        }
        await apiRequest("POST", "/api/users", payload);
        toast({
          title: "User created",
          description: "User has been created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user information. Leave password blank to keep current password."
              : "Add a new user to the system. They will be able to login with the provided credentials."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password {isEditing && "(leave blank to keep current)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? "••••••••" : "Enter password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isAdmin && isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {!isAdmin && isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Only admins can change user roles
                    </p>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

