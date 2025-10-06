export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const intRep = parseInt(hex.replace("#", "0x"), 16);
  return {
    r: (intRep >> 16) & 255,
    g: (intRep >> 8) & 255,
    b: intRep & 255,
  };
}

// https://en.wikipedia.org/wiki/Y%E2%80%B2UV
export function rbgToLuminance(r: number, g: number, b: number): number {
  return Math.round((r * 299 + g * 587 + b * 114) / 1000);
}
