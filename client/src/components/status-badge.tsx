import { Badge } from "@/components/ui/badge";
import type { 
  clientStatuses, 
  projectStatuses, 
  invoiceStatuses 
} from "@shared/schema";

type ClientStatus = typeof clientStatuses[number];
type ProjectStatus = typeof projectStatuses[number];
type InvoiceStatus = typeof invoiceStatuses[number];

interface StatusBadgeProps {
  status?: ClientStatus | ProjectStatus | InvoiceStatus | null;
  type: "client" | "project" | "invoice";
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-100 text-gray-800 border-gray-200 text-xs font-medium px-2 py-0.5 rounded-full border"
        data-testid="badge-status-unknown"
      >
        Unknown
      </Badge>
    );
  }

  const getVariantAndColor = () => {
    if (type === "client") {
      switch (status as ClientStatus) {
        case "ACTIVE":
          return "bg-green-100 text-green-800 border-green-200";
        case "INACTIVE":
          return "bg-gray-100 text-gray-800 border-gray-200";
        case "ARCHIVED":
          return "bg-slate-100 text-slate-800 border-slate-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    if (type === "project") {
      switch (status as ProjectStatus) {
        case "ACTIVE":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "ON_HOLD":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "COMPLETED":
          return "bg-green-100 text-green-800 border-green-200";
        case "CANCELLED":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    // Invoice statuses
    switch (status as InvoiceStatus) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "SENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "PARTIALLY_PAID":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Badge
      variant="outline"
      className={`${getVariantAndColor()} text-xs font-medium px-2 py-0.5 rounded-full border`}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {formatStatus(status)}
    </Badge>
  );
}
