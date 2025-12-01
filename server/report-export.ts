import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Response } from "express";

// ============================================
// EXCEL EXPORT UTILITIES
// ============================================

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

interface ExcelExportOptions {
  sheetName: string;
  title: string;
  subtitle?: string;
  columns: ExcelColumn[];
  data: any[];
  summary?: { label: string; value: string | number }[];
  companyName?: string;
  dateRange?: string;
  orientation?: "portrait" | "landscape";
}

export async function generateExcel(res: Response, options: ExcelExportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HQ CRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.sheetName);

  // Set page orientation for printing
  if (options.orientation) {
    sheet.pageSetup.orientation = options.orientation;
  }

  // Add company header
  let currentRow = 1;
  if (options.companyName) {
    sheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + options.columns.length)}${currentRow}`);
    const companyCell = sheet.getCell(`A${currentRow}`);
    companyCell.value = options.companyName;
    companyCell.font = { size: 16, bold: true };
    companyCell.alignment = { horizontal: "center" };
    currentRow++;
  }

  // Add title
  sheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + options.columns.length)}${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = options.title;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center" };
  currentRow++;

  // Add subtitle/date range
  if (options.subtitle || options.dateRange) {
    sheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + options.columns.length)}${currentRow}`);
    const subtitleCell = sheet.getCell(`A${currentRow}`);
    subtitleCell.value = options.subtitle || options.dateRange || "";
    subtitleCell.font = { size: 11, italic: true };
    subtitleCell.alignment = { horizontal: "center" };
    currentRow++;
  }

  // Add empty row
  currentRow++;

  // Set columns
  sheet.columns = options.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  // Style header row
  const headerRow = sheet.getRow(currentRow);
  headerRow.values = options.columns.map((col) => col.header);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;
  currentRow++;

  // Add data rows
  options.data.forEach((row) => {
    const dataRow = sheet.getRow(currentRow);
    options.columns.forEach((col, index) => {
      const cell = dataRow.getCell(index + 1);
      cell.value = row[col.key];

      // Apply number formatting for currency columns
      if (typeof row[col.key] === "number" && col.key !== "quantity" && col.key !== "count" && col.key !== "rate") {
        cell.numFmt = '"Rs. "#,##0.00';
      }
    });
    dataRow.alignment = { vertical: "middle" };
    currentRow++;
  });

  // Add summary section if provided
  if (options.summary && options.summary.length > 0) {
    currentRow++; // Empty row
    options.summary.forEach((item) => {
      const summaryRow = sheet.getRow(currentRow);
      summaryRow.getCell(options.columns.length - 1).value = item.label;
      summaryRow.getCell(options.columns.length - 1).font = { bold: true };
      summaryRow.getCell(options.columns.length).value = item.value;
      summaryRow.getCell(options.columns.length).font = { bold: true };
      if (typeof item.value === "number") {
        summaryRow.getCell(options.columns.length).numFmt = '"Rs. "#,##0.00';
      }
      currentRow++;
    });
  }

  // Add borders to data area
  const lastDataRow = currentRow - 1;
  for (let row = 5; row <= lastDataRow; row++) {
    for (let col = 1; col <= options.columns.length; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  // Add footer
  currentRow += 2;
  sheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + options.columns.length)}${currentRow}`);
  const footerCell = sheet.getCell(`A${currentRow}`);
  footerCell.value = `Generated on ${new Date().toLocaleString("en-IN")} by HQ CRM`;
  footerCell.font = { size: 9, italic: true, color: { argb: "FF666666" } };
  footerCell.alignment = { horizontal: "center" };

  // Set response headers
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${options.sheetName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx"`);

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
}

// ============================================
// PDF EXPORT UTILITIES
// ============================================

interface PDFColumn {
  header: string;
  key: string;
  width: number;
  align?: "left" | "center" | "right";
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: PDFColumn[];
  data: any[];
  summary?: { label: string; value: string | number }[];
  companyName?: string;
  dateRange?: string;
  orientation?: "portrait" | "landscape";
}

export function generatePDF(res: Response, options: PDFExportOptions): void {
  const doc = new PDFDocument({
    size: "A4",
    layout: options.orientation || "portrait",
    margin: 40,
  });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${options.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf"`);

  doc.pipe(res);

  const pageWidth = doc.page.width - 80; // Account for margins
  let yPosition = 50;

  // Company name
  if (options.companyName) {
    doc.fontSize(18).font("Helvetica-Bold").text(options.companyName, 40, yPosition, {
      align: "center",
      width: pageWidth,
    });
    yPosition += 30;
  }

  // Title
  doc.fontSize(14).font("Helvetica-Bold").text(options.title, 40, yPosition, {
    align: "center",
    width: pageWidth,
  });
  yPosition += 25;

  // Subtitle/Date range
  if (options.subtitle || options.dateRange) {
    doc.fontSize(10).font("Helvetica-Oblique").fillColor("#666666").text(options.subtitle || options.dateRange || "", 40, yPosition, {
      align: "center",
      width: pageWidth,
    });
    yPosition += 20;
  }

  doc.fillColor("#000000");
  yPosition += 10;

  // Calculate column widths
  const totalWidth = options.columns.reduce((sum, col) => sum + col.width, 0);
  const scale = pageWidth / totalWidth;
  const scaledColumns = options.columns.map((col) => ({
    ...col,
    width: col.width * scale,
  }));

  // Draw table header
  const headerHeight = 25;
  doc.rect(40, yPosition, pageWidth, headerHeight).fill("#4472C4");

  let xPosition = 40;
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF");
  scaledColumns.forEach((col) => {
    doc.text(col.header, xPosition + 3, yPosition + 7, {
      width: col.width - 6,
      align: col.align || "left",
    });
    xPosition += col.width;
  });

  yPosition += headerHeight;
  doc.fillColor("#000000");

  // Draw data rows
  const rowHeight = 20;
  let alternateRow = false;

  options.data.forEach((row, index) => {
    // Check if we need a new page
    if (yPosition + rowHeight > doc.page.height - 80) {
      doc.addPage();
      yPosition = 50;

      // Redraw header on new page
      doc.rect(40, yPosition, pageWidth, headerHeight).fill("#4472C4");
      xPosition = 40;
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF");
      scaledColumns.forEach((col) => {
        doc.text(col.header, xPosition + 3, yPosition + 7, {
          width: col.width - 6,
          align: col.align || "left",
        });
        xPosition += col.width;
      });
      yPosition += headerHeight;
      doc.fillColor("#000000");
      alternateRow = false;
    }

    // Alternate row background
    if (alternateRow) {
      doc.rect(40, yPosition, pageWidth, rowHeight).fill("#F2F2F2");
    }
    alternateRow = !alternateRow;

    // Draw row border
    doc.rect(40, yPosition, pageWidth, rowHeight).stroke("#CCCCCC");

    // Draw cell content
    xPosition = 40;
    doc.fontSize(8).font("Helvetica").fillColor("#000000");
    scaledColumns.forEach((col) => {
      let value = row[col.key];
      if (typeof value === "number" && col.key !== "quantity" && col.key !== "count" && col.key !== "rate") {
        value = formatIndianCurrency(value);
      }
      doc.text(String(value ?? ""), xPosition + 3, yPosition + 5, {
        width: col.width - 6,
        align: col.align || "left",
        lineBreak: false,
      });
      xPosition += col.width;
    });

    yPosition += rowHeight;
  });

  // Draw summary section
  if (options.summary && options.summary.length > 0) {
    yPosition += 15;

    options.summary.forEach((item) => {
      if (yPosition + 20 > doc.page.height - 80) {
        doc.addPage();
        yPosition = 50;
      }

      const labelWidth = pageWidth * 0.7;
      const valueWidth = pageWidth * 0.3;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text(item.label, 40 + labelWidth - 100, yPosition, {
        width: 100,
        align: "right",
      });

      let value = item.value;
      if (typeof value === "number") {
        value = formatIndianCurrency(value);
      }
      doc.text(String(value), 40 + labelWidth, yPosition, {
        width: valueWidth,
        align: "right",
      });

      yPosition += 18;
    });
  }

  // Footer
  const footerY = doc.page.height - 50;
  doc.fontSize(8).font("Helvetica-Oblique").fillColor("#666666");
  doc.text(`Generated on ${new Date().toLocaleString("en-IN")} by HQ CRM`, 40, footerY, {
    align: "center",
    width: pageWidth,
  });

  doc.end();
}

// Helper function to format currency in Indian format
function formatIndianCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
}

// ============================================
// REPORT-SPECIFIC EXPORT CONFIGURATIONS
// ============================================

export const reportConfigs = {
  // Financial Reports
  revenueByClient: {
    sheetName: "Revenue by Client",
    title: "Revenue by Client Report",
    columns: [
      { header: "Client Name", key: "clientName", width: 30 },
      { header: "Total Revenue", key: "totalRevenue", width: 20, align: "right" as const },
    ],
  },

  invoiceAging: {
    sheetName: "Invoice Aging",
    title: "Invoice Aging Report",
    columns: [
      { header: "Client", key: "clientName", width: 25 },
      { header: "Invoice #", key: "invoiceNumber", width: 15 },
      { header: "Amount", key: "amount", width: 15, align: "right" as const },
      { header: "Due Date", key: "dueDate", width: 12 },
      { header: "Days Overdue", key: "daysOverdue", width: 12, align: "right" as const },
      { header: "Aging Bucket", key: "agingBucket", width: 15 },
    ],
  },

  expensesByCategory: {
    sheetName: "Expenses by Category",
    title: "Expense Tracking Report",
    columns: [
      { header: "Category", key: "category", width: 25 },
      { header: "Amount", key: "amount", width: 20, align: "right" as const },
      { header: "Percentage", key: "percentage", width: 15, align: "right" as const },
      { header: "Count", key: "count", width: 10, align: "right" as const },
    ],
  },

  profitByClient: {
    sheetName: "Profit by Client",
    title: "Profit by Client Report",
    columns: [
      { header: "Client", key: "clientName", width: 25 },
      { header: "Revenue", key: "revenue", width: 18, align: "right" as const },
      { header: "Expenses", key: "expenses", width: 18, align: "right" as const },
      { header: "Profit", key: "profit", width: 18, align: "right" as const },
      { header: "Margin %", key: "margin", width: 12, align: "right" as const },
    ],
  },

  profitLoss: {
    sheetName: "Profit & Loss",
    title: "Profit & Loss Statement",
    columns: [
      { header: "Particulars", key: "particulars", width: 40 },
      { header: "Amount", key: "amount", width: 25, align: "right" as const },
    ],
  },

  balanceSheet: {
    sheetName: "Balance Sheet",
    title: "Balance Sheet",
    columns: [
      { header: "Particulars", key: "particulars", width: 40 },
      { header: "Amount", key: "amount", width: 25, align: "right" as const },
    ],
  },

  cashFlow: {
    sheetName: "Cash Flow",
    title: "Cash Flow Statement",
    columns: [
      { header: "Period", key: "period", width: 15 },
      { header: "Opening", key: "openingBalance", width: 18, align: "right" as const },
      { header: "Inflows", key: "inflows", width: 18, align: "right" as const },
      { header: "Outflows", key: "outflows", width: 18, align: "right" as const },
      { header: "Net Flow", key: "netCashFlow", width: 18, align: "right" as const },
      { header: "Closing", key: "closingBalance", width: 18, align: "right" as const },
    ],
  },

  generalLedger: {
    sheetName: "General Ledger",
    title: "General Ledger",
    columns: [
      { header: "Date", key: "date", width: 12 },
      { header: "Voucher No", key: "voucherNo", width: 15 },
      { header: "Particulars", key: "particulars", width: 30 },
      { header: "Account Head", key: "accountHead", width: 20 },
      { header: "Debit", key: "debit", width: 15, align: "right" as const },
      { header: "Credit", key: "credit", width: 15, align: "right" as const },
      { header: "Balance", key: "balance", width: 15, align: "right" as const },
    ],
  },

  trialBalance: {
    sheetName: "Trial Balance",
    title: "Trial Balance",
    columns: [
      { header: "Account Name", key: "accountName", width: 35 },
      { header: "Account Type", key: "accountType", width: 20 },
      { header: "Debit", key: "debit", width: 20, align: "right" as const },
      { header: "Credit", key: "credit", width: 20, align: "right" as const },
    ],
  },

  fixedAssets: {
    sheetName: "Fixed Asset Register",
    title: "Fixed Asset Register",
    columns: [
      { header: "Asset Name", key: "name", width: 25 },
      { header: "Category", key: "category", width: 15 },
      { header: "Purchase Date", key: "purchaseDate", width: 12 },
      { header: "Purchase Value", key: "purchaseValue", width: 15, align: "right" as const },
      { header: "Method", key: "depreciationMethod", width: 10 },
      { header: "Depreciation", key: "accumulatedDepreciation", width: 15, align: "right" as const },
      { header: "Current Value", key: "currentValue", width: 15, align: "right" as const },
      { header: "Status", key: "status", width: 10 },
    ],
  },

  // GST Reports
  gstSalesRegister: {
    sheetName: "GST Sales Register",
    title: "GSTR-1 Sales Register",
    columns: [
      { header: "Invoice No", key: "invoiceNumber", width: 15 },
      { header: "Date", key: "invoiceDate", width: 12 },
      { header: "Client", key: "clientName", width: 25 },
      { header: "GSTIN", key: "gstin", width: 18 },
      { header: "Type", key: "invoiceType", width: 8 },
      { header: "Taxable Value", key: "taxableValue", width: 15, align: "right" as const },
      { header: "CGST", key: "cgst", width: 12, align: "right" as const },
      { header: "SGST", key: "sgst", width: 12, align: "right" as const },
      { header: "IGST", key: "igst", width: 12, align: "right" as const },
      { header: "Total", key: "invoiceValue", width: 15, align: "right" as const },
    ],
  },

  gstPurchaseRegister: {
    sheetName: "GST Purchase Register",
    title: "Purchase Register (ITC)",
    columns: [
      { header: "Voucher No", key: "voucherNumber", width: 15 },
      { header: "Date", key: "voucherDate", width: 12 },
      { header: "Vendor", key: "vendorName", width: 25 },
      { header: "GSTIN", key: "gstin", width: 18 },
      { header: "Description", key: "description", width: 25 },
      { header: "Taxable", key: "taxableValue", width: 12, align: "right" as const },
      { header: "GST", key: "totalGst", width: 12, align: "right" as const },
      { header: "Total", key: "totalValue", width: 12, align: "right" as const },
      { header: "ITC", key: "itcEligible", width: 8 },
    ],
  },

  gstr3bSummary: {
    sheetName: "GSTR-3B Summary",
    title: "GSTR-3B Monthly Summary",
    columns: [
      { header: "Particulars", key: "particulars", width: 40 },
      { header: "Taxable Value", key: "taxableValue", width: 18, align: "right" as const },
      { header: "CGST", key: "cgst", width: 15, align: "right" as const },
      { header: "SGST", key: "sgst", width: 15, align: "right" as const },
      { header: "IGST", key: "igst", width: 15, align: "right" as const },
      { header: "Total", key: "total", width: 18, align: "right" as const },
    ],
  },

  hsnSummary: {
    sheetName: "HSN Summary",
    title: "HSN/SAC Summary",
    columns: [
      { header: "SAC Code", key: "hsnCode", width: 12 },
      { header: "Description", key: "description", width: 35 },
      { header: "Quantity", key: "quantity", width: 10, align: "right" as const },
      { header: "Taxable Value", key: "taxableValue", width: 18, align: "right" as const },
      { header: "CGST", key: "cgst", width: 12, align: "right" as const },
      { header: "SGST", key: "sgst", width: 12, align: "right" as const },
      { header: "Total Tax", key: "totalTax", width: 15, align: "right" as const },
    ],
  },

  gstRateSummary: {
    sheetName: "GST Rate Summary",
    title: "GST Rate-wise Summary",
    columns: [
      { header: "GST Rate", key: "rate", width: 12 },
      { header: "Invoices", key: "invoiceCount", width: 10, align: "right" as const },
      { header: "Taxable Value", key: "taxableValue", width: 18, align: "right" as const },
      { header: "CGST", key: "cgst", width: 12, align: "right" as const },
      { header: "SGST", key: "sgst", width: 12, align: "right" as const },
      { header: "IGST", key: "igst", width: 12, align: "right" as const },
      { header: "Total Tax", key: "totalTax", width: 15, align: "right" as const },
      { header: "Invoice Value", key: "invoiceValue", width: 18, align: "right" as const },
    ],
  },
};
