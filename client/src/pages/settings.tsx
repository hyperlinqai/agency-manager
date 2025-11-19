import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil } from "lucide-react";
import { ServiceDialog } from "@/components/service-dialog";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const handleNewService = () => {
    setSelectedService(null);
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsServiceDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsServiceDialogOpen(false);
    setSelectedService(null);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SEO: "SEO",
      SOCIAL_MEDIA: "Social Media",
      CONTENT: "Content",
      ADVERTISING: "Advertising",
      DESIGN: "Design",
      DEVELOPMENT: "Development",
      CONSULTING: "Consulting",
      OTHER: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Service Catalog</CardTitle>
                <Button onClick={handleNewService} data-testid="button-new-service">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : services && services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Default Price</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                        <TableCell className="font-medium" data-testid={`text-name-${service.id}`}>
                          {service.name}
                        </TableCell>
                        <TableCell data-testid={`text-category-${service.id}`}>
                          {getCategoryLabel(service.category)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={service.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}
                            data-testid={`badge-status-${service.id}`}
                          >
                            {service.status === "ACTIVE" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-price-${service.id}`}>
                          {service.currency} {formatCurrency(service.defaultPrice)}
                        </TableCell>
                        <TableCell data-testid={`text-currency-${service.id}`}>
                          {service.currency}
                        </TableCell>
                        <TableCell data-testid={`text-unit-${service.id}`}>
                          {service.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-updated-${service.id}`}>
                          {formatDate(service.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditService(service)}
                            data-testid={`button-edit-${service.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-services">
                  <p className="text-muted-foreground">No services found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first service to get started
                  </p>
                  <Button onClick={handleNewService} className="mt-4" data-testid="button-create-first-service">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ServiceDialog
        service={selectedService}
        open={isServiceDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
