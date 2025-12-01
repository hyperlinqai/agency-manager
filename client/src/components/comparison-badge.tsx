import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComparisonBadgeProps {
  label: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ComparisonBadge({
  label,
  change,
  trend,
  size = 'sm',
  showLabel = true
}: ComparisonBadgeProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  const isNeutral = trend === 'neutral';

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium",
        size === 'sm' ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1",
        isPositive && "text-green-600 bg-green-50",
        isNegative && "text-red-600 bg-red-50",
        isNeutral && "text-gray-500 bg-gray-50"
      )}
    >
      {showLabel && <span className="text-muted-foreground">{label}</span>}
      <TrendIcon className={cn(size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
      <span>{Math.abs(change).toFixed(1)}%</span>
    </div>
  );
}

interface ComparisonGroupProps {
  mom?: { change: number; trend: 'up' | 'down' | 'neutral' };
  yoy?: { change: number; trend: 'up' | 'down' | 'neutral' };
  qoq?: { change: number; trend: 'up' | 'down' | 'neutral' };
  size?: 'sm' | 'md';
}

export function ComparisonGroup({ mom, yoy, qoq, size = 'sm' }: ComparisonGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {mom && (
        <ComparisonBadge
          label="MoM"
          change={mom.change}
          trend={mom.trend}
          size={size}
        />
      )}
      {yoy && (
        <ComparisonBadge
          label="YoY"
          change={yoy.change}
          trend={yoy.trend}
          size={size}
        />
      )}
      {qoq && (
        <ComparisonBadge
          label="QoQ"
          change={qoq.change}
          trend={qoq.trend}
          size={size}
        />
      )}
    </div>
  );
}

interface MetricComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  periodLabel: string;
  formatValue?: (value: number) => string;
}

export function MetricComparisonCard({
  title,
  currentValue,
  previousValue,
  change,
  trend,
  periodLabel,
  formatValue = (v) => `Rs. ${v.toLocaleString('en-IN')}`
}: MetricComparisonCardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-bold mb-2">{formatValue(currentValue)}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          vs {formatValue(previousValue)}
        </span>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-green-600",
            isNegative && "text-red-600",
            !isPositive && !isNegative && "text-gray-500"
          )}
        >
          {isPositive && <TrendingUp className="h-4 w-4" />}
          {isNegative && <TrendingDown className="h-4 w-4" />}
          {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
          <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{periodLabel}</div>
    </div>
  );
}
