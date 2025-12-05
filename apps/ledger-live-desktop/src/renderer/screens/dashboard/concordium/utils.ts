// Helper to safely extract value from protobuf-style objects
export function extractValue(obj: any): string {
  if (obj === null || obj === undefined) {
    return "—";
  }
  if (typeof obj === "object" && "value" in obj) {
    return extractValue(obj.value);
  }
  if (typeof obj === "object" && "microCcdAmount" in obj) {
    return extractValue(obj.microCcdAmount);
  }
  if (typeof obj === "object" && "@type" in obj && "value" in obj) {
    return String(obj.value);
  }
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  return String(obj);
}

// Format microCCD to CCD
export function formatMicroCcd(microCcd: any): string {
  try {
    const valueStr = extractValue(microCcd);
    const value = BigInt(valueStr);
    const ccd = Number(value) / 1_000_000;
    return ccd.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  } catch (e) {
    console.warn("[Concordium] Failed to format microCcd:", microCcd, e);
    return "—";
  }
}

// Parse CCD to microCCD
export function parseCcdToMicroCcd(ccd: string): bigint {
  const num = parseFloat(ccd);
  if (isNaN(num) || num < 0) {
    throw new Error("Invalid CCD amount");
  }
  return BigInt(Math.floor(num * 1_000_000));
}
