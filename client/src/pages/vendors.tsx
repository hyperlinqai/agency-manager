import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VendorDialog } from "@/components/vendor-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VendorsPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors", { 
      status: statusFilter || undefined, 
      search: searchQuery || undefined, 
      category: categoryFilter || undefined 
    }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/vendors/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor deleted successfully" });
      setDeletingVendor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingVendor(null);
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SOFTWARE: "Software",
      MEDIA_BUY: "Media Buy",
      FREELANCER: "Freelancer",
      AGENCY: "Agency",
      SUPPLIER: "Supplier",
      OTHER: "Other",
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your vendors and suppliers
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-vendor">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="SOFTWARE">Software</SelectItem>
            <SelectItem value="MEDIA_BUY">Media Buy</SelectItem>
            <SelectItem value="FREELANCER">Freelancer</SelectItem>
            <SelectItem value="AGENCY">Agency</SelectItem>
            <SelectItem value="SUPPLIER">Supplier</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Category
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
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No vendors found. Click "Add Vendor" to create one.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => handleEdit(vendor)}
                    data-testid={`vendor-row-${vendor.id}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-sm" data-testid={`vendor-name-${vendor.id}`}>
                          {vendor.name}
                        </div>
                        {vendor.website && (
                          <div className="text-xs text-muted-foreground">{vendor.website}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div data-testid={`vendor-contact-${vendor.id}`}>{vendor.contactName}</div>
                        <div className="text-xs text-muted-foreground">{vendor.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" data-testid={`vendor-category-${vendor.id}`}>
                        {getCategoryLabel(vendor.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={getStatusBadgeVariant(vendor.status)}
                        data-testid={`vendor-status-${vendor.id}`}
                      >
                        {vendor.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(vendor)}
                          data-testid={`button-edit-${vendor.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={vendor.status === "ACTIVE" ? "secondary" : "default"}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: vendor.id,
                              status: vendor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                            })
                          }
                          data-testid={`button-toggle-status-${vendor.id}`}
                        >
                          {vendor.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingVendor(vendor)}
                          data-testid={`button-delete-${vendor.id}`}
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

      {showDialog && (
        <VendorDialog
          vendor={editingVendor}
          open={showDialog}
          onClose={handleCloseDialog}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletingVendor}
        onOpenChange={(open) => !open && setDeletingVendor(null)}
        onConfirm={() => deletingVendor && deleteMutation.mutate(deletingVendor.id)}
        title="Delete Vendor"
        itemName={deletingVendor?.name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
