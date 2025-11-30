import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileSignature,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContractWithRelations } from "@shared/schema";

export default function ContractsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingContract, setDeletingContract] = useState<ContractWithRelations | null>(null);

  const { data: contracts, isLoading } = useQuery<ContractWithRelations[]>({
    queryKey: ["/api/contracts", { status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return apiRequest("DELETE", `/api/contracts/${contractId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract deleted",
        description: "Contract has been deleted successfully",
      });
      setDeletingContract(null);
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
      return apiRequest("POST", `/api/contracts/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Status updated",
        description: "Contract status has been updated",
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

  const filteredContracts = contracts?.filter(contract => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "PENDING_SIGNATURE": return "bg-yellow-100 text-yellow-700";
      case "SIGNED": return "bg-blue-100 text-blue-700";
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "COMPLETED": return "bg-purple-100 text-purple-700";
      case "TERMINATED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client contracts and agreements
          </p>
        </div>
        <Link href="/contracts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
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
            <SelectItem value="PENDING_SIGNATURE">Pending Signature</SelectItem>
            <SelectItem value="SIGNED">Signed</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contracts</p>
            <p className="text-2xl font-bold">{contracts?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {contracts?.filter(c => c.status === "ACTIVE" || c.status === "SIGNED").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Signature</p>
            <p className="text-2xl font-bold text-yellow-600">
              {contracts?.filter(c => c.status === "PENDING_SIGNATURE").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(contracts?.reduce((sum, c) => sum + c.contractValue, 0) || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredContracts || filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No contracts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first contract to get started
              </p>
              <Link href="/contracts/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Contract
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Contract #</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Start Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">End Date</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Value</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow 
                    key={contract.id} 
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium text-primary">
                      {contract.contractNumber}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {contract.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.clientName}
                    </TableCell>
                    <TableCell>{formatDate(contract.startDate)}</TableCell>
                    <TableCell>{contract.endDate ? formatDate(contract.endDate) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(contract.contractValue)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status.replace("_", " ")}
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
                            navigate(`/contracts/${contract.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {contract.status === "DRAFT" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contracts/${contract.id}/edit`);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {contract.status === "DRAFT" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ id: contract.id, status: "PENDING_SIGNATURE" });
                            }}>
                              <FileSignature className="h-4 w-4 mr-2" />
                              Send for Signature
                            </DropdownMenuItem>
                          )}
                          {contract.status === "PENDING_SIGNATURE" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ id: contract.id, status: "SIGNED" });
                            }}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Signed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingContract(contract);
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
        open={!!deletingContract}
        onOpenChange={(open) => !open && setDeletingContract(null)}
        onConfirm={() => deletingContract && deleteMutation.mutate(deletingContract.id)}
        title="Delete Contract"
        itemName={deletingContract?.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

