import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import type { Expense } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

const markPaidSchema = z.object({
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string(),
});

type MarkPaidForm = z.infer<typeof markPaidSchema>;

interface MarkExpensePaidDialogProps {
  expense: Expense;
  open: boolean;
  onClose: () => void;
}

export function MarkExpensePaidDialog({ expense, open, onClose }: MarkExpensePaidDialogProps) {
  const { toast } = useToast();

  const form = useForm<MarkPaidForm>({
    resolver: zodResolver(markPaidSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "BANK_TRANSFER",
      reference: "",
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (data: MarkPaidForm) => {
      return apiRequest(`/api/expenses/${expense.id}/mark-paid`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense marked as paid" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: MarkPaidForm) => {
    markPaidMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Mark Expense as Paid</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Amount to pay</div>
          <div className="text-2xl font-semibold mt-1" data-testid="expense-amount">
            {formatCurrency(Number(expense.amount), expense.currency)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">{expense.description}</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-payment-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Transaction ID or reference" data-testid="input-reference" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={markPaidMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={markPaidMutation.isPending} data-testid="button-submit">
                {markPaidMutation.isPending ? "Marking..." : "Mark as Paid"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
