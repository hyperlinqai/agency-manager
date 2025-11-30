import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Proposal, CompanyProfile } from "@shared/schema";
import { formatDate } from "@/lib/utils";

// Professional color palette
const colors = {
  primary: "#1e3a5f",      // Deep navy blue
  secondary: "#2563eb",    // Bright blue accent
  accent: "#0ea5e9",       // Sky blue
  success: "#059669",      // Emerald green
  dark: "#0f172a",         // Slate 900
  gray: {
    900: "#111827",
    800: "#1f2937",
    700: "#374151",
    600: "#4b5563",
    500: "#6b7280",
    400: "#9ca3af",
    300: "#d1d5db",
    200: "#e5e7eb",
    100: "#f3f4f6",
    50: "#f9fafb",
  },
  white: "#ffffff",
};

// Define styles for professional proposal PDF
const styles = StyleSheet.create({
  // Page styles
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: colors.white,
  },

  // ==========================================
  // COVER PAGE STYLES
  // ==========================================
  coverPage: {
    flex: 1,
    position: "relative",
  },
  coverHeader: {
    backgroundColor: colors.primary,
    height: 280,
    paddingHorizontal: 50,
    paddingTop: 40,
    position: "relative",
  },
  coverHeaderPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    opacity: 0.1,
  },
  coverLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 50,
  },
  logoContainer: {
    width: 70,
    height: 70,
    backgroundColor: colors.white,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  logoImage: {
    width: 54,
    height: 54,
    objectFit: "contain",
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
  },
  companyNameCover: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  companyTagline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  proposalBadge: {
    position: "absolute",
    top: 40,
    right: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  proposalBadgeLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  proposalBadgeNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  coverTitleSection: {
    marginTop: 30,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 1.2,
    maxWidth: 400,
  },
  coverContent: {
    flex: 1,
    paddingHorizontal: 50,
    paddingTop: 50,
    backgroundColor: colors.white,
  },
  preparedForSection: {
    marginBottom: 40,
  },
  preparedForLabel: {
    fontSize: 10,
    color: colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
  },
  clientNameCover: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 8,
  },
  clientDetailsCover: {
    fontSize: 11,
    color: colors.gray[600],
    lineHeight: 1.6,
  },
  coverMetaGrid: {
    flexDirection: "row",
    gap: 40,
    marginTop: 30,
  },
  coverMetaItem: {
    flex: 1,
  },
  coverMetaLabel: {
    fontSize: 9,
    color: colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coverMetaValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  coverFooter: {
    paddingHorizontal: 50,
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverContactInfo: {
    flexDirection: "row",
    gap: 25,
  },
  coverContactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coverContactText: {
    fontSize: 9,
    color: colors.gray[600],
  },
  coverPageNumber: {
    fontSize: 9,
    color: colors.gray[400],
  },

  // ==========================================
  // CONTENT PAGE STYLES
  // ==========================================
  contentPage: {
    paddingHorizontal: 50,
    paddingTop: 50,
    paddingBottom: 80,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  pageHeaderLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pageHeaderLogoImage: {
    width: 35,
    height: 35,
    objectFit: "contain",
  },
  pageHeaderCompany: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
  },
  pageHeaderTitle: {
    fontSize: 10,
    color: colors.gray[500],
    textAlign: "right",
  },
  pageHeaderProposal: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "right",
  },
  pageFooter: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 15,
  },
  pageFooterText: {
    fontSize: 8,
    color: colors.gray[400],
  },
  pageNumber: {
    fontSize: 9,
    color: colors.gray[500],
    fontWeight: "bold",
  },

  // Section styles
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionIconText: {
    fontSize: 14,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.dark,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Executive Summary
  executiveSummaryBox: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  executiveSummaryText: {
    fontSize: 11,
    color: colors.gray[700],
    lineHeight: 1.8,
    textAlign: "justify",
  },

  // Scope of Services
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 16,
    overflow: "hidden",
  },
  serviceCardHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceCardTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.white,
  },
  serviceCardPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  serviceCardBody: {
    padding: 16,
  },
  serviceDescription: {
    fontSize: 10,
    color: colors.gray[600],
    lineHeight: 1.6,
    marginBottom: 16,
  },
  serviceSubSection: {
    marginBottom: 12,
  },
  serviceSubTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  deliverableItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingLeft: 4,
  },
  deliverableBullet: {
    width: 6,
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 4,
  },
  deliverableText: {
    flex: 1,
    fontSize: 9,
    color: colors.gray[700],
    lineHeight: 1.5,
  },
  kpiItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingLeft: 4,
  },
  kpiBullet: {
    width: 6,
    height: 6,
    backgroundColor: colors.success,
    borderRadius: 3,
    marginRight: 10,
  },
  kpiText: {
    flex: 1,
    fontSize: 9,
    color: colors.gray[700],
    lineHeight: 1.5,
  },
  serviceTimeline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  serviceTimelineLabel: {
    fontSize: 9,
    color: colors.gray[600],
    marginRight: 8,
  },
  serviceTimelineValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Timeline Section
  timelineContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 24,
  },
  timelineGrid: {
    flexDirection: "row",
    gap: 20,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: "center",
  },
  timelineCardLabel: {
    fontSize: 9,
    color: colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  timelineCardValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
  },
  timelineCardSub: {
    fontSize: 9,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Investment/Pricing Section
  pricingContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: "hidden",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pricingLabel: {
    fontSize: 11,
    color: colors.gray[700],
  },
  pricingValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.dark,
  },
  pricingDiscount: {
    fontSize: 11,
    color: colors.success,
  },
  pricingDiscountValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.success,
  },
  pricingTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  pricingTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
  },
  pricingTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },

  // Payment Schedule
  paymentScheduleContainer: {
    marginTop: 20,
  },
  paymentScheduleTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 12,
  },
  paymentScheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: 6,
    padding: 14,
    marginBottom: 8,
  },
  paymentScheduleNumber: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  paymentScheduleNumberText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.white,
  },
  paymentScheduleDetails: {
    flex: 1,
  },
  paymentScheduleMilestone: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 2,
  },
  paymentSchedulePercent: {
    fontSize: 9,
    color: colors.gray[500],
  },
  paymentScheduleAmount: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Terms & Conditions
  termsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 20,
  },
  termsText: {
    fontSize: 9,
    color: colors.gray[600],
    lineHeight: 1.8,
  },

  // Signature Section
  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: 220,
  },
  signatureLabel: {
    fontSize: 9,
    color: colors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 30,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[400],
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  signatureTitle: {
    fontSize: 9,
    color: colors.gray[500],
    marginTop: 2,
  },
  validityBox: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  validityLabel: {
    fontSize: 9,
    color: colors.gray[500],
    marginBottom: 4,
  },
  validityDate: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Notes section
  notesSection: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.gray[700],
    marginBottom: 8,
  },
  notesText: {
    fontSize: 9,
    color: colors.gray[600],
    lineHeight: 1.6,
  },
});

interface ProposalPDFProps {
  proposal: Proposal;
  companyProfile?: CompanyProfile;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  logoBase64?: string;
}

// Currency formatter
const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₹ ${formatted}`;
};

export function ProposalPDF({
  proposal,
  companyProfile,
  clientName,
  clientEmail,
  clientAddress,
  logoBase64,
}: ProposalPDFProps) {
  // Only use base64 logo - remote URLs don't work with @react-pdf/renderer due to CORS
  const logoSrc = logoBase64;
  const companyName = companyProfile?.companyName || "Your Company";

  return (
    <Document>
      {/* COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          {/* Header Section */}
          <View style={styles.coverHeader}>
            <View style={styles.coverLogo}>
              {logoSrc ? (
                <View style={styles.logoContainer}>
                  <Image style={styles.logoImage} src={logoSrc} />
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoLetter}>
                    {companyName[0]?.toUpperCase() || "H"}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.companyNameCover}>{companyName}</Text>
                <Text style={styles.companyTagline}>
                  {companyProfile?.addressLine1 || "Digital Marketing & Technology Solutions"}
                </Text>
              </View>
            </View>

            <View style={styles.proposalBadge}>
              <Text style={styles.proposalBadgeLabel}>Proposal</Text>
              <Text style={styles.proposalBadgeNumber}>{proposal.proposalNumber}</Text>
            </View>

            <View style={styles.coverTitleSection}>
              <Text style={styles.coverTitle}>{proposal.title}</Text>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.coverContent}>
            <View style={styles.preparedForSection}>
              <Text style={styles.preparedForLabel}>Prepared For</Text>
              <Text style={styles.clientNameCover}>{clientName || "Valued Client"}</Text>
              {clientEmail && <Text style={styles.clientDetailsCover}>{clientEmail}</Text>}
              {clientAddress && <Text style={styles.clientDetailsCover}>{clientAddress}</Text>}
            </View>

            <View style={styles.coverMetaGrid}>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Date Issued</Text>
                <Text style={styles.coverMetaValue}>
                  {formatDate(proposal.createdAt, "MMMM dd, yyyy")}
                </Text>
              </View>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Valid Until</Text>
                <Text style={styles.coverMetaValue}>
                  {formatDate(proposal.validUntil, "MMMM dd, yyyy")}
                </Text>
              </View>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Total Investment</Text>
                <Text style={styles.coverMetaValue}>
                  {formatCurrency(proposal.totalAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.coverFooter}>
            <View style={styles.coverContactInfo}>
              {companyProfile?.phone && (
                <View style={styles.coverContactItem}>
                  <Text style={styles.coverContactText}>{companyProfile.phone}</Text>
                </View>
              )}
              {companyProfile?.email && (
                <View style={styles.coverContactItem}>
                  <Text style={styles.coverContactText}>{companyProfile.email}</Text>
                </View>
              )}
            </View>
            <Text style={styles.coverPageNumber}>Page 1</Text>
          </View>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY PAGE */}
      {proposal.executiveSummary && (
        <Page size="A4" style={styles.page}>
          <View style={styles.contentPage}>
            {/* Page Header */}
            <View style={styles.pageHeader}>
              <View style={styles.pageHeaderLogo}>
                {logoSrc && <Image style={styles.pageHeaderLogoImage} src={logoSrc} />}
                <Text style={styles.pageHeaderCompany}>{companyName}</Text>
              </View>
              <View>
                <Text style={styles.pageHeaderTitle}>Business Proposal</Text>
                <Text style={styles.pageHeaderProposal}>{proposal.proposalNumber}</Text>
              </View>
            </View>

            {/* Executive Summary Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionIconText}>📋</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Executive Summary</Text>
                  <Text style={styles.sectionSubtitle}>Overview of our proposed solution</Text>
                </View>
              </View>
              <View style={styles.executiveSummaryBox}>
                <Text style={styles.executiveSummaryText}>{proposal.executiveSummary}</Text>
              </View>
            </View>

            {/* Page Footer */}
            <View style={styles.pageFooter}>
              <Text style={styles.pageFooterText}>
                {companyName} | Confidential Business Proposal
              </Text>
              <Text style={styles.pageNumber}>Page 2</Text>
            </View>
          </View>
        </Page>
      )}

      {/* SCOPE OF SERVICES PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLogo}>
              {logoSrc && <Image style={styles.pageHeaderLogoImage} src={logoSrc} />}
              <Text style={styles.pageHeaderCompany}>{companyName}</Text>
            </View>
            <View>
              <Text style={styles.pageHeaderTitle}>Business Proposal</Text>
              <Text style={styles.pageHeaderProposal}>{proposal.proposalNumber}</Text>
            </View>
          </View>

          {/* Scope of Services Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>🎯</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Scope of Services</Text>
                <Text style={styles.sectionSubtitle}>Detailed breakdown of services included</Text>
              </View>
            </View>

            {proposal.services?.map((service, index) => (
              <View key={index} style={styles.serviceCard} wrap={false}>
                <View style={styles.serviceCardHeader}>
                  <Text style={styles.serviceCardTitle}>{service.name}</Text>
                  <Text style={styles.serviceCardPrice}>{formatCurrency(service.price)}</Text>
                </View>
                <View style={styles.serviceCardBody}>
                  {service.description && (
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  )}

                  {service.deliverables && service.deliverables.length > 0 && (
                    <View style={styles.serviceSubSection}>
                      <Text style={styles.serviceSubTitle}>Deliverables</Text>
                      {service.deliverables.map((deliverable, idx) => (
                        <View key={idx} style={styles.deliverableItem}>
                          <View style={styles.deliverableBullet} />
                          <Text style={styles.deliverableText}>{deliverable}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {service.kpis && service.kpis.length > 0 && (
                    <View style={styles.serviceSubSection}>
                      <Text style={styles.serviceSubTitle}>Key Performance Indicators</Text>
                      {service.kpis.map((kpi, idx) => (
                        <View key={idx} style={styles.kpiItem}>
                          <View style={styles.kpiBullet} />
                          <Text style={styles.kpiText}>{kpi}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {service.timeline && (
                    <View style={styles.serviceTimeline}>
                      <Text style={styles.serviceTimelineLabel}>Timeline:</Text>
                      <Text style={styles.serviceTimelineValue}>{service.timeline}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterText}>
              {companyName} | Confidential Business Proposal
            </Text>
            <Text style={styles.pageNumber}>Page {proposal.executiveSummary ? "3" : "2"}</Text>
          </View>
        </View>
      </Page>

      {/* TIMELINE & INVESTMENT PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLogo}>
              {logoSrc && <Image style={styles.pageHeaderLogoImage} src={logoSrc} />}
              <Text style={styles.pageHeaderCompany}>{companyName}</Text>
            </View>
            <View>
              <Text style={styles.pageHeaderTitle}>Business Proposal</Text>
              <Text style={styles.pageHeaderProposal}>{proposal.proposalNumber}</Text>
            </View>
          </View>

          {/* Timeline Section */}
          {(proposal.projectStartDate || proposal.projectEndDate || proposal.projectDuration) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionIconText}>📅</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Project Timeline</Text>
                  <Text style={styles.sectionSubtitle}>Proposed schedule for project delivery</Text>
                </View>
              </View>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineGrid}>
                  {proposal.projectStartDate && (
                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineCardLabel}>Start Date</Text>
                      <Text style={styles.timelineCardValue}>
                        {formatDate(proposal.projectStartDate, "MMM dd, yyyy")}
                      </Text>
                    </View>
                  )}
                  {proposal.projectEndDate && (
                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineCardLabel}>End Date</Text>
                      <Text style={styles.timelineCardValue}>
                        {formatDate(proposal.projectEndDate, "MMM dd, yyyy")}
                      </Text>
                    </View>
                  )}
                  {proposal.projectDuration && (
                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineCardLabel}>Duration</Text>
                      <Text style={styles.timelineCardValue}>{proposal.projectDuration}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Investment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>💰</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Investment Summary</Text>
                <Text style={styles.sectionSubtitle}>Transparent pricing breakdown</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Subtotal</Text>
                <Text style={styles.pricingValue}>{formatCurrency(proposal.subtotal)}</Text>
              </View>

              {proposal.discount > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingDiscount}>
                    Discount {proposal.discountType === "PERCENTAGE" ? `(${proposal.discount}%)` : ""}
                  </Text>
                  <Text style={styles.pricingDiscountValue}>
                    - {formatCurrency(
                      proposal.discountType === "PERCENTAGE"
                        ? (proposal.subtotal * proposal.discount) / 100
                        : proposal.discount
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Tax (GST @ {proposal.taxRate}%)</Text>
                <Text style={styles.pricingValue}>{formatCurrency(proposal.taxAmount)}</Text>
              </View>

              <View style={styles.pricingTotal}>
                <Text style={styles.pricingTotalLabel}>Total Investment</Text>
                <Text style={styles.pricingTotalValue}>{formatCurrency(proposal.totalAmount)}</Text>
              </View>
            </View>

            {/* Payment Schedule */}
            {proposal.paymentSchedule && proposal.paymentSchedule.length > 0 && (
              <View style={styles.paymentScheduleContainer}>
                <Text style={styles.paymentScheduleTitle}>Payment Schedule</Text>
                {proposal.paymentSchedule.map((payment, index) => (
                  <View key={index} style={styles.paymentScheduleItem}>
                    <View style={styles.paymentScheduleNumber}>
                      <Text style={styles.paymentScheduleNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.paymentScheduleDetails}>
                      <Text style={styles.paymentScheduleMilestone}>{payment.milestone}</Text>
                      <Text style={styles.paymentSchedulePercent}>{payment.percentage}% of total</Text>
                    </View>
                    <Text style={styles.paymentScheduleAmount}>
                      {formatCurrency((proposal.totalAmount * payment.percentage) / 100)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterText}>
              {companyName} | Confidential Business Proposal
            </Text>
            <Text style={styles.pageNumber}>Page {proposal.executiveSummary ? "4" : "3"}</Text>
          </View>
        </View>
      </Page>

      {/* TERMS & SIGNATURE PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLogo}>
              {logoSrc && <Image style={styles.pageHeaderLogoImage} src={logoSrc} />}
              <Text style={styles.pageHeaderCompany}>{companyName}</Text>
            </View>
            <View>
              <Text style={styles.pageHeaderTitle}>Business Proposal</Text>
              <Text style={styles.pageHeaderProposal}>{proposal.proposalNumber}</Text>
            </View>
          </View>

          {/* Notes Section */}
          {proposal.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Additional Notes</Text>
              <Text style={styles.notesText}>{proposal.notes}</Text>
            </View>
          )}

          {/* Terms & Conditions Section */}
          {proposal.termsAndConditions && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionIconText}>📜</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                  <Text style={styles.sectionSubtitle}>Agreement terms and guidelines</Text>
                </View>
              </View>
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>{proposal.termsAndConditions}</Text>
              </View>
            </View>
          )}

          {/* Signature Section */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>For {companyName}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>
                {companyProfile?.authorizedSignatoryName || "Authorized Signatory"}
              </Text>
              <Text style={styles.signatureTitle}>
                {companyProfile?.authorizedSignatoryTitle || "Director"}
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Client Acceptance</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{clientName || "Client Name"}</Text>
              <Text style={styles.signatureTitle}>Authorized Representative</Text>
            </View>
          </View>

          {/* Validity Box */}
          <View style={{ marginTop: 30, alignItems: "center" }}>
            <View style={styles.validityBox}>
              <Text style={styles.validityLabel}>This proposal is valid until</Text>
              <Text style={styles.validityDate}>
                {formatDate(proposal.validUntil, "MMMM dd, yyyy")}
              </Text>
            </View>
          </View>

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterText}>
              {companyName} | Confidential Business Proposal
            </Text>
            <Text style={styles.pageNumber}>Page {proposal.executiveSummary ? "5" : "4"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
