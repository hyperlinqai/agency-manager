import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { InvoiceWithRelations, CompanyProfile, Payment } from "@shared/schema";
import { formatDate } from "@/lib/utils";

// Helper function to parse terms and conditions into numbered lines
const parseTermsIntoLines = (terms: string): string[] => {
  // Split by common patterns: "1.", "1)", "1:", or newlines followed by numbers
  const lines = terms.split(/(?=\d+[\.\)\:])|[\n\r]+/).filter(line => line.trim());
  return lines.map(line => line.trim()).filter(Boolean);
};

// Define styles matching the HTML invoice view design
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#f9fafb",
  },
  // Main container
  container: {
    margin: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
  },
  // Header section with gradient-like teal background
  header: {
    backgroundColor: "#0d9488",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 44,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  logoImage: {
    width: 38,
    height: 38,
    objectFit: "contain",
    borderRadius: 4,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  companyInfo: {
    marginLeft: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: "#ccfbf1",
  },
  invoiceLabelBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    padding: 8,
    alignItems: "flex-end",
  },
  invoiceLabelText: {
    fontSize: 7,
    color: "#ccfbf1",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Meta row (phone, email, date)
  metaRow: {
    backgroundColor: "#f9fafb",
    padding: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  metaLeft: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 8,
    color: "#4b5563",
  },
  metaDate: {
    fontSize: 8,
    color: "#4b5563",
  },
  metaDateLabel: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  // Bill To & Payment Info columns
  infoColumns: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  infoBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 5,
  },
  infoBoxIndicator: {
    width: 2,
    height: 12,
    backgroundColor: "#14b8a6",
    borderRadius: 1,
  },
  infoBoxTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBoxContent: {
    gap: 4,
  },
  infoName: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 8,
    color: "#4b5563",
    lineHeight: 1.3,
  },
  infoTextBrand: {
    fontSize: 8,
    color: "#0d9488",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  paymentLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  paymentValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
  },
  paymentValueMono: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  // Line Items Table
  tableContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0d9488",
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
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
    fontSize: 8,
    color: "#111827",
  },
  tableCellMuted: {
    fontSize: 8,
    color: "#4b5563",
  },
  tableCellBold: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  // Totals Section
  totalsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 180,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  totalsRowHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  totalsLabel: {
    fontSize: 7,
    color: "#6b7280",
  },
  totalsLabelBold: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#374151",
  },
  totalsLabelGreen: {
    fontSize: 7,
    color: "#059669",
  },
  totalsValue: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  totalsValueBold: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Courier",
  },
  totalsValueGreen: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#059669",
    fontFamily: "Courier",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#0d9488",
  },
  grandTotalLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Courier",
  },
  // Amount in Words
  amountInWordsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  amountInWordsBox: {
    backgroundColor: "#f0fdfa",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  amountInWordsText: {
    fontSize: 7,
    color: "#0f766e",
  },
  amountInWordsLabel: {
    fontWeight: "bold",
  },
  // Notes Section
  notesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  notesBox: {
    backgroundColor: "#fffbeb",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fef3c7",
    flexDirection: "row",
    gap: 10,
  },
  notesIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fbbf24",
    justifyContent: "center",
    alignItems: "center",
  },
  notesIconText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  notesContent: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 7,
    color: "#b45309",
    lineHeight: 1.4,
  },
  // Terms Section
  termsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  termsBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  termsTitle: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  termsText: {
    fontSize: 6,
    color: "#4b5563",
    lineHeight: 1.3,
  },
  termsItem: {
    fontSize: 6,
    color: "#4b5563",
    lineHeight: 1.3,
    marginBottom: 2,
  },
  // Footer Section (QR & Signature)
  footerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minHeight: 100,
  },
  qrSection: {
    alignItems: "flex-start",
    maxWidth: 140,
  },
  qrTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  qrBox: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  qrImage: {
    width: 52,
    height: 52,
  },
  qrPlaceholderBox: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholderText: {
    fontSize: 6,
    color: "#9ca3af",
  },
  upiIdText: {
    fontSize: 6,
    color: "#0d9488",
    marginTop: 4,
    maxWidth: 120,
  },
  paymentLinkText: {
    fontSize: 6,
    color: "#6b7280",
    marginTop: 2,
    maxWidth: 120,
  },
  signatureSection: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  signatureLine: {
    width: 100,
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 1,
  },
  signatureTitle: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 1,
  },
  signatureDate: {
    fontSize: 6,
    color: "#9ca3af",
  },
  // Footer Branding
  brandingFooter: {
    backgroundColor: "#111827",
    padding: 10,
    alignItems: "center",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  brandingText: {
    fontSize: 7,
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
  upiQrCode?: string; // Base64 data URL for UPI QR code
  logoBase64?: string; // Base64 data URL for company logo
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

export function InvoicePDF({ invoice, companyProfile, clientAddress, clientEmail, payments, upiQrCode, logoBase64 }: InvoicePDFProps) {
  // Simple currency formatter without symbol issues in PDF
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    // Use Rs. instead of ₹ symbol to avoid PDF rendering issues
    return `Rs. ${formatted}`;
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
              {logoBase64 ? (
                <View style={styles.logoContainer}>
                  <Image style={styles.logoImage} src={logoBase64} />
                </View>
              ) : companyProfile?.logoUrl ? (
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
              <View style={styles.totalsRowHighlight}>
                <Text style={styles.totalsLabelBold}>Grand Total</Text>
                <Text style={styles.totalsValueBold}>{formatCurrency(invoice.totalAmount)}</Text>
              </View>
              {invoice.amountPaid > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabelGreen}>Amount Paid</Text>
                  <Text style={styles.totalsValueGreen}>- {formatCurrency(invoice.amountPaid)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Balance Due</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(invoice.balanceDue)}</Text>
              </View>
            </View>
          </View>

          {/* Amount in Words (Balance Due) */}
          <View style={styles.amountInWordsContainer}>
            <View style={styles.amountInWordsBox}>
              <Text style={styles.amountInWordsText}>
                <Text style={styles.amountInWordsLabel}>Balance due in words: </Text>
                {numberToWords(invoice.balanceDue)}
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
                {parseTermsIntoLines(companyProfile.invoiceTerms).map((line, index) => (
                  <Text key={index} style={styles.termsItem}>{line}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Footer Section (QR & Signature) */}
          <View style={styles.footerSection}>
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Scan to Pay</Text>
              {upiQrCode ? (
                <>
                  <View style={styles.qrBox}>
                    <Image style={styles.qrImage} src={upiQrCode} />
                  </View>
                  {companyProfile?.upiId && (
                    <Text style={styles.upiIdText}>UPI: {companyProfile.upiId}</Text>
                  )}
                  {companyProfile?.paymentLink && (
                    <Text style={styles.paymentLinkText}>Or pay online</Text>
                  )}
                </>
              ) : companyProfile?.upiId ? (
                <>
                  <View style={styles.qrPlaceholderBox}>
                    <Text style={styles.qrPlaceholderText}>UPI QR</Text>
                  </View>
                  <Text style={styles.upiIdText}>UPI: {companyProfile.upiId}</Text>
                </>
              ) : (
                <View style={styles.qrPlaceholderBox}>
                  <Text style={styles.qrPlaceholderText}>No UPI</Text>
                </View>
              )}
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
