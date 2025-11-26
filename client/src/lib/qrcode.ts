import QRCode from "qrcode";

/**
 * Generate a UPI payment URL
 * @param upiId - UPI ID (e.g., "merchant@upi")
 * @param payeeName - Name of the payee/merchant
 * @param amount - Amount to pay (optional)
 * @param transactionNote - Note for the transaction (optional)
 * @returns UPI payment URL
 */
export function generateUPIUrl(
  upiId: string,
  payeeName: string,
  amount?: number,
  transactionNote?: string
): string {
  const params = new URLSearchParams();
  params.set("pa", upiId); // Payee address (UPI ID)
  params.set("pn", payeeName); // Payee name
  
  if (amount && amount > 0) {
    params.set("am", amount.toFixed(2)); // Amount
  }
  
  if (transactionNote) {
    params.set("tn", transactionNote); // Transaction note
  }
  
  params.set("cu", "INR"); // Currency
  
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate a QR code as a data URL (base64)
 * @param data - Data to encode in QR code
 * @returns Promise<string> - Base64 data URL of the QR code
 */
export async function generateQRCodeDataUrl(data: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: 150,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

/**
 * Generate a UPI QR code as a data URL
 * @param upiId - UPI ID
 * @param payeeName - Name of the payee
 * @param amount - Amount (optional)
 * @param invoiceNumber - Invoice number for transaction note (optional)
 * @returns Promise<string> - Base64 data URL of the QR code
 */
export async function generateUPIQRCode(
  upiId: string,
  payeeName: string,
  amount?: number,
  invoiceNumber?: string
): Promise<string> {
  const transactionNote = invoiceNumber ? `Payment for Invoice ${invoiceNumber}` : undefined;
  const upiUrl = generateUPIUrl(upiId, payeeName, amount, transactionNote);
  return generateQRCodeDataUrl(upiUrl);
}

