import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { MonthlyReportWithRelations } from "@shared/schema";

interface ReportComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportIds: string[];
}

export function ReportComparisonDialog({
  open,
  onOpenChange,
  reportIds,
}: ReportComparisonDialogProps) {
  const { data: reports, isLoading } = useQuery<MonthlyReportWithRelations[]>({
    queryKey: ["/api/monthly-reports", "comparison", reportIds],
    enabled: open && reportIds.length >= 2,
    queryFn: async () => {
      const promises = reportIds.map((id) =>
        apiRequest<MonthlyReportWithRelations>("GET", `/api/monthly-reports/${id}`)
      );
      return Promise.all(promises);
    },
  });

  if (!open || reportIds.length < 2) {
    return null;
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Compare Reports</DialogTitle>
            <DialogDescription>Loading reports...</DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reports || reports.length < 2) {
    return null;
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "INCREASE":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DECREASE":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "INCREASE":
        return "text-green-600";
      case "DECREASE":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Get all unique metric names across all reports
  const allMetricNames = new Set<string>();
  reports.forEach((report) => {
    report.metrics?.forEach((metric) => {
      allMetricNames.add(metric.name);
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Reports</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of {reports.length} selected reports
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Report Headers */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
              {reports.map((report) => (
                <Card key={report.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-mono text-xs">{report.reportNumber}</p>
                      <p>{report.clientName}</p>
                      <p>{report.reportMonth}</p>
                      <Badge variant="secondary" className="mt-2">
                        {report.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
                  {reports.map((report, idx) => (
                    <div key={report.id} className="text-sm">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {report.executiveSummary || "No summary provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Comparison */}
            {allMetricNames.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">KPI Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(allMetricNames).map((metricName) => (
                      <div key={metricName}>
                        <h4 className="font-semibold text-sm mb-2">{metricName}</h4>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
                          {reports.map((report) => {
                            const metric = (report.metrics || []).find((m) => m.name === metricName);
                            return (
                              <div key={report.id} className="border rounded-lg p-3">
                                {metric ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-2xl font-bold">
                                        {metric.value} {metric.unit}
                                      </span>
                                      {getChangeIcon(metric.changeType)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <p>Previous: {metric.previousValue} {metric.unit}</p>
                                      <p className={`font-medium ${getChangeColor(metric.changeType)}`}>
                                        {metric.change > 0 ? "+" : ""}
                                        {metric.change}% {metric.changeType}
                                      </p>
                                    </div>
                                    {metric.notes && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {metric.notes}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">—</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
                  {reports.map((report) => (
                    <div key={report.id}>
                      {report.highlights && report.highlights.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {report.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-muted-foreground">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No highlights</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
                  {reports.map((report) => (
                    <div key={report.id}>
                      {report.challenges && report.challenges.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {report.challenges.map((challenge, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span className="text-muted-foreground">{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No challenges</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
                  {reports.map((report) => (
                    <div key={report.id}>
                      {report.recommendations && report.recommendations.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {report.recommendations.map((recommendation, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span className="text-muted-foreground">{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recommendations</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: reports.length <= 3 ? `repeat(${reports.length}, 1fr)` : undefined }}>
                  {reports.map((report) => (
                    <div key={report.id}>
                      {report.attachments && report.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {report.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 border rounded text-sm"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate flex-1"
                              >
                                {attachment.name}
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No attachments</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

