import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { ClientDialog } from "@/components/client-dialog";
import type { ClientWithStats } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: clients, isLoading } = useQuery<ClientWithStats[]>({
    queryKey: ["/api/clients", { status: statusFilter === "all" ? undefined : statusFilter, search }],
  });

  const filteredClients = clients || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your agency's client relationships
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-client">
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            data-testid="input-search-clients"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No clients found</p>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                {search ? "Try adjusting your search" : "Add your first client to get started"}
              </p>
              {!search && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-first-client"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first client
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Client Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Contact Person</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Invoiced</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Outstanding</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="pr-6 text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="border-none hover:bg-muted/30 transition-colors"
                      data-testid={`row-client-${client.id}`}
                    >
                      <TableCell className="pl-6">
                        <div className="font-medium" data-testid={`text-name-${client.id}`}>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-contact-${client.id}`}>
                        {client.contactName}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-email-${client.id}`}>
                        {client.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-phone-${client.id}`}>
                        {client.phone}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm" data-testid={`text-invoiced-${client.id}`}>
                        {formatCurrency(client.totalInvoiced || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-medium text-amber-600" data-testid={`text-outstanding-${client.id}`}>
                          {formatCurrency(client.outstandingAmount || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={client.status} type="client" />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Link href={`/clients/${client.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary"
                            data-testid={`button-view-${client.id}`}
                          >
                            View
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
