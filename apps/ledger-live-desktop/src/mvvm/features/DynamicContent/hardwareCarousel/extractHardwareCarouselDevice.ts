import type { HardwareCarouselDevice } from "./analytics";

export function extractHardwareCarouselDevice(title?: string): HardwareCarouselDevice | null {
  if (!title) {
    return null;
  }

  const titleLower = title.toLowerCase();
  if (
    titleLower.includes("gen5") ||
    titleLower.includes("gen 5") ||
    titleLower.includes("nano pod")
  ) {
    return "ledger gen5";
  }
  if (titleLower.includes("flex")) {
    return "ledger flex";
  }
  if (titleLower.includes("stax")) {
    return "ledger stax";
  }

  return null;
}
