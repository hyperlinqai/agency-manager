import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExpenseDialog } from "@/components/expense-dialog";
import { MarkExpensePaidDialog } from "@/components/mark-expense-paid-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense, Vendor, ExpenseCategory } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExpensesPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [markingPaidExpense, setMarkingPaidExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", { 
      status: statusFilter || undefined, 
      vendorId: vendorFilter || undefined, 
      categoryId: categoryFilter || undefined 
    }],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Success", description: "Expense deleted successfully" });
      setDeletingExpense(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingExpense(null);
  };

  const handleMarkPaid = (expense: Expense) => {
    setMarkingPaidExpense(expense);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "DUE":
        return "secondary";
      case "OVERDUE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return "—";
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.name || "Unknown";
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading expenses...</div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const paidExpenses = expenses
    .filter((exp) => exp.status === "PAID")
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const dueExpenses = expenses
    .filter((exp) => exp.status === "DUE")
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage business expenses
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-expense">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Expenses</div>
          <div className="text-2xl font-semibold mt-1" data-testid="total-expenses">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Paid</div>
          <div className="text-2xl font-semibold mt-1 text-green-600" data-testid="paid-expenses">
            {formatCurrency(paidExpenses)}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Due</div>
          <div className="text-2xl font-semibold mt-1 text-orange-600" data-testid="due-expenses">
            {formatCurrency(dueExpenses)}
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="DUE">Due</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-vendor-filter">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Description
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Vendor
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Category
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium uppercase tracking-wide">
                  Amount
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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No expenses found. Click "Add Expense" to create one.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => handleEdit(expense)}
                    data-testid={`expense-row-${expense.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm" data-testid={`expense-date-${expense.id}`}>
                        {formatDate(expense.expenseDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" data-testid={`expense-description-${expense.id}`}>
                        {expense.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" data-testid={`expense-vendor-${expense.id}`}>
                        {getVendorName(expense.vendorId)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" data-testid={`expense-category-${expense.id}`}>
                        {getCategoryName(expense.categoryId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium tabular-nums" data-testid={`expense-amount-${expense.id}`}>
                        {formatCurrency(Number(expense.amount))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={getStatusBadgeVariant(expense.status)}
                        data-testid={`expense-status-${expense.id}`}
                      >
                        {expense.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(expense)}
                          data-testid={`button-edit-${expense.id}`}
                        >
                          Edit
                        </Button>
                        {expense.status !== "PAID" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(expense)}
                            data-testid={`button-mark-paid-${expense.id}`}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingExpense(expense)}
                          data-testid={`button-delete-${expense.id}`}
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
        <ExpenseDialog
          expense={editingExpense}
          open={showDialog}
          onClose={handleCloseDialog}
        />
      )}

      {markingPaidExpense && (
        <MarkExpensePaidDialog
          expense={markingPaidExpense}
          open={!!markingPaidExpense}
          onClose={() => setMarkingPaidExpense(null)}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        onConfirm={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
        title="Delete Expense"
        itemName={deletingExpense?.description}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
