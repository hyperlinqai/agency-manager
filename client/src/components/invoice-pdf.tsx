import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { InvoiceWithRelations, CompanyProfile, Payment } from "@shared/schema";
import { formatDate } from "@/lib/utils";

// Define styles matching the HTML invoice view design
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#f9fafb",
  },
  // Main container
  container: {
    margin: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  // Header section with gradient-like teal background
  header: {
    backgroundColor: "#0d9488",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  logoImage: {
    width: 48,
    height: 48,
    objectFit: "contain",
    borderRadius: 6,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  companyInfo: {
    marginLeft: 12,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 10,
    color: "#ccfbf1",
  },
  invoiceLabelBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    padding: 10,
    alignItems: "flex-end",
  },
  invoiceLabelText: {
    fontSize: 8,
    color: "#ccfbf1",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Meta row (phone, email, date)
  metaRow: {
    backgroundColor: "#f9fafb",
    padding: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  metaLeft: {
    flexDirection: "row",
    gap: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 9,
    color: "#4b5563",
  },
  metaDate: {
    fontSize: 9,
    color: "#4b5563",
  },
  metaDateLabel: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  // Bill To & Payment Info columns
  infoColumns: {
    flexDirection: "row",
    padding: 24,
    gap: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  infoBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  infoBoxIndicator: {
    width: 3,
    height: 16,
    backgroundColor: "#14b8a6",
    borderRadius: 2,
  },
  infoBoxTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBoxContent: {
    gap: 6,
  },
  infoName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  infoTextBrand: {
    fontSize: 9,
    color: "#0d9488",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  paymentValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
  },
  paymentValueMono: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  // Line Items Table
  tableContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0d9488",
    padding: 12,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, alignItems: "center" },
  colUnitPrice: { flex: 2, alignItems: "flex-end" },
  colAmount: { flex: 2, alignItems: "flex-end" },
  tableCell: {
    fontSize: 9,
    color: "#111827",
  },
  tableCellMuted: {
    fontSize: 9,
    color: "#4b5563",
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  // Totals Section
  totalsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 220,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  totalsLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#0d9488",
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Courier",
  },
  // Amount in Words
  amountInWordsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  amountInWordsBox: {
    backgroundColor: "#f0fdfa",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  amountInWordsText: {
    fontSize: 9,
    color: "#0f766e",
  },
  amountInWordsLabel: {
    fontWeight: "bold",
  },
  // Notes Section
  notesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  notesBox: {
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fef3c7",
    flexDirection: "row",
    gap: 10,
  },
  notesIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fbbf24",
    justifyContent: "center",
    alignItems: "center",
  },
  notesIconText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  notesContent: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#b45309",
    lineHeight: 1.5,
  },
  // Terms Section
  termsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  termsBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  termsTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  // Footer Section (QR & Signature)
  footerSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qrSection: {
    alignItems: "flex-start",
  },
  qrTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  qrBox: {
    width: 70,
    height: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholderText: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 4,
  },
  signatureSection: {
    alignItems: "flex-end",
  },
  signatureLine: {
    width: 150,
    height: 40,
    borderBottomWidth: 2,
    borderBottomColor: "#9ca3af",
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  signatureDate: {
    fontSize: 8,
    color: "#9ca3af",
  },
  // Footer Branding
  brandingFooter: {
    backgroundColor: "#111827",
    padding: 14,
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  brandingText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  brandingHighlight: {
    color: "#5eead4",
    fontWeight: "bold",
  },
});

interface InvoicePDFProps {
  invoice: InvoiceWithRelations;
  companyProfile?: CompanyProfile;
  clientAddress?: string;
  clientEmail?: string;
  payments?: Payment[];
}

// Helper to convert number to words
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  
  let result = '';
  
  if (intPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
    num = intPart % 10000000;
  } else {
    num = intPart;
  }
  
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
    num = num % 100000;
  }
  
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
    num = num % 1000;
  }
  
  if (num > 0) {
    result += convertLessThanThousand(num);
  }
  
  result = result.trim() + ' Rupees';
  
  if (decPart > 0) {
    result += ' and ' + convertLessThanThousand(decPart) + ' Paise';
  }
  
  return result + ' Only';
}

export function InvoicePDF({ invoice, companyProfile, clientAddress, clientEmail, payments }: InvoicePDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: invoice.currency || "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate tax rate from invoice data
  const taxRate = invoice.subtotal > 0 
    ? ((invoice.taxAmount / invoice.subtotal) * 100).toFixed(0)
    : "0";

  const amountInWords = numberToWords(invoice.totalAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {companyProfile?.logoUrl ? (
                <View style={styles.logoContainer}>
                  <Image style={styles.logoImage} src={companyProfile.logoUrl} />
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoLetter}>
                    {(companyProfile?.companyName?.[0] || "H").toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {companyProfile?.companyName || "Hyperlinq Technology"}
                </Text>
                <Text style={styles.companyTagline}>Invoice Service</Text>
              </View>
            </View>
            <View style={styles.invoiceLabelBox}>
              <Text style={styles.invoiceLabelText}>Invoice</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
          </View>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>{companyProfile?.phone || "+91 98765 43210"}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>{companyProfile?.email || "contact@hyperlinq.tech"}</Text>
              </View>
            </View>
            <Text style={styles.metaDate}>
              <Text style={styles.metaDateLabel}>Date: </Text>
              {formatDate(invoice.issueDate, "MMMM dd, yyyy")}
            </Text>
          </View>

          {/* Bill To & Payment Info Columns */}
          <View style={styles.infoColumns}>
            {/* Bill To */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <View style={styles.infoBoxIndicator} />
                <Text style={styles.infoBoxTitle}>Bill To</Text>
              </View>
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoName}>{invoice.clientName}</Text>
                {clientEmail && <Text style={styles.infoText}>{clientEmail}</Text>}
                {clientAddress && <Text style={styles.infoText}>{clientAddress}</Text>}
              </View>
            </View>

            {/* Payment Info */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <View style={styles.infoBoxIndicator} />
                <Text style={styles.infoBoxTitle}>Payment Info</Text>
              </View>
              <View style={styles.infoBoxContent}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Method:</Text>
                  <Text style={styles.paymentValue}>Bank Transfer</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Beneficiary:</Text>
                  <Text style={styles.paymentValue}>
                    {companyProfile?.companyName || "Hyperlinq Technology"}
                  </Text>
                </View>
                {companyProfile?.bankAccountNumber && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Account No:</Text>
                    <Text style={styles.paymentValueMono}>{companyProfile.bankAccountNumber}</Text>
                  </View>
                )}
                {companyProfile?.bankIfscCode && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>IFSC:</Text>
                    <Text style={styles.paymentValueMono}>{companyProfile.bankIfscCode}</Text>
                  </View>
                )}
                {companyProfile?.bankName && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Bank:</Text>
                    <Text style={styles.paymentValue}>{companyProfile.bankName}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Line Items Table */}
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.colDesc}>
                  <Text style={styles.tableHeaderText}>Description</Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                </View>
                <View style={styles.colUnitPrice}>
                  <Text style={styles.tableHeaderText}>Unit Price</Text>
                </View>
                <View style={styles.colAmount}>
                  <Text style={styles.tableHeaderText}>Amount</Text>
                </View>
              </View>
              {invoice.lineItems?.map((item, index) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {}
                  ]}
                >
                  <View style={styles.colDesc}>
                    <Text style={styles.tableCell}>{item.description}</Text>
                  </View>
                  <View style={styles.colQty}>
                    <Text style={styles.tableCellMuted}>{item.quantity}</Text>
                  </View>
                  <View style={styles.colUnitPrice}>
                    <Text style={styles.tableCellMuted}>{formatCurrency(item.unitPrice)}</Text>
                  </View>
                  <View style={styles.colAmount}>
                    <Text style={styles.tableCellBold}>{formatCurrency(item.lineTotal)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Totals Section */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.totalsValue}>{formatCurrency(invoice.taxAmount)}</Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Amount in Words */}
          <View style={styles.amountInWordsContainer}>
            <View style={styles.amountInWordsBox}>
              <Text style={styles.amountInWordsText}>
                <Text style={styles.amountInWordsLabel}>Amount in words: </Text>
                {amountInWords}
              </Text>
            </View>
          </View>

          {/* Notes Section */}
          {invoice.notes && (
            <View style={styles.notesContainer}>
              <View style={styles.notesBox}>
                <View style={styles.notesIcon}>
                  <Text style={styles.notesIconText}>i</Text>
                </View>
                <View style={styles.notesContent}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Terms Section */}
          {companyProfile?.invoiceTerms && (
            <View style={styles.termsContainer}>
              <View style={styles.termsBox}>
                <Text style={styles.termsTitle}>Terms & Conditions</Text>
                <Text style={styles.termsText}>{companyProfile.invoiceTerms}</Text>
              </View>
            </View>
          )}

          {/* Footer Section (QR & Signature) */}
          <View style={styles.footerSection}>
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Scan to Pay</Text>
              <View style={styles.qrBox}>
                <Text style={styles.qrPlaceholderText}>QR Code</Text>
              </View>
            </View>
            <View style={styles.signatureSection}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>
                {companyProfile?.authorizedSignatoryName || "Authorized Signatory"}
              </Text>
              <Text style={styles.signatureTitle}>
                {companyProfile?.authorizedSignatoryTitle || "Authorized Signatory"}
              </Text>
              <Text style={styles.signatureDate}>
                {formatDate(invoice.issueDate, "MMMM dd, yyyy")}
              </Text>
            </View>
          </View>

          {/* Footer Branding */}
          <View style={styles.brandingFooter}>
            <Text style={styles.brandingText}>
              Thank you for your business! | Generated by{" "}
              <Text style={styles.brandingHighlight}>
                {companyProfile?.companyName || "Hyperlinq Technology"}
              </Text>
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
