/**
 * Utility functions for PDF generation
 */

/**
 * Convert an image URL (remote or data URL) to a PNG base64 data URL
 * that is compatible with @react-pdf/renderer.
 *
 * Handles:
 * - Remote URLs (Cloudinary, etc.) - fetches and converts
 * - SVG data URLs - converts to PNG via canvas
 * - PNG/JPEG data URLs - returns as-is
 */
export async function convertImageForPdf(imageUrl: string | undefined | null): Promise<string | undefined> {
  if (!imageUrl || imageUrl.trim() === '') {
    return undefined;
  }

  const url = imageUrl.trim();

  // If it's an SVG data URL, convert to PNG
  if (url.startsWith('data:image/svg')) {
    return convertSvgToPng(url);
  }

  // If it's already a PNG or JPEG data URL, use directly
  if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
    return url;
  }

  // If it's a remote URL, fetch and convert to base64
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return fetchImageAsBase64(url);
  }

  // For any other data URL, try to convert via canvas
  if (url.startsWith('data:')) {
    return convertViaCanvas(url);
  }

  return undefined;
}

/**
 * Convert SVG data URL to PNG data URL using canvas
 */
async function convertSvgToPng(svgDataUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Use a reasonable size for the logo
        const size = Math.max(img.width || 200, img.height || 200);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill with transparent background
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, size, size);
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        } else {
          resolve(undefined);
        }
      } catch (e) {
        console.error('SVG to PNG conversion failed:', e);
        resolve(undefined);
      }
    };

    img.onerror = () => {
      console.error('Failed to load SVG image');
      resolve(undefined);
    };

    img.src = svgDataUrl;
  });
}

/**
 * Fetch a remote image and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // If it's an SVG, convert to PNG
        if (result.startsWith('data:image/svg')) {
          convertSvgToPng(result).then(resolve);
        } else {
          resolve(result);
        }
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to fetch image:', e);
    // Fallback: try loading via Image element
    return convertViaCanvas(url);
  }
}

/**
 * Convert any image URL to PNG via canvas
 */
async function convertViaCanvas(imageUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        } else {
          resolve(undefined);
        }
      } catch (e) {
        console.error('Canvas conversion failed:', e);
        resolve(undefined);
      }
    };

    img.onerror = () => {
      console.error('Image load failed:', imageUrl.substring(0, 50));
      resolve(undefined);
    };

    // Set timeout to prevent hanging
    setTimeout(() => resolve(undefined), 5000);

    img.src = imageUrl;
  });
}
