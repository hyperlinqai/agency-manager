import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { UserDialog } from "@/components/user-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users as UsersIcon,
  Shield,
  UserCheck,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const isAdmin = currentUser?.role === "ADMIN";

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { role: roleFilter !== "all" ? roleFilter : undefined, search: searchQuery || undefined }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
      setDeletingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge variant="default" className="gap-1">
            <UserCheck className="h-3 w-3" />
            Manager
          </Badge>
        );
      case "STAFF":
        return (
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" />
            Staff
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "text-red-600";
      case "MANAGER":
        return "text-blue-600";
      case "STAFF":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={handleCreateUser}>
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{users?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold text-red-600">
              {users?.filter((u) => u.role === "ADMIN").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Managers</p>
            <p className="text-2xl font-bold text-blue-600">
              {users?.filter((u) => u.role === "MANAGER").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Staff</p>
            <p className="text-2xl font-bold text-gray-600">
              {users?.filter((u) => u.role === "STAFF").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || roleFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first user to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Created</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(new Date(user.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isAdmin || (currentUser?.role === "MANAGER" && user.role === "STAFF") || user.id === currentUser?.id) && (
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {isAdmin && user.id !== currentUser?.id && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
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
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        title="Delete User"
        itemName={deletingUser?.name}
        isLoading={deleteMutation.isPending}
      />

      <UserDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
        user={editingUser}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

