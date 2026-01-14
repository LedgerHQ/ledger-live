// Utility to map any size to valid crypto-icons sizes
// For React Native (returns numbers)
export const getValidCryptoIconSizeNative = (size: number): 16 | 20 | 24 | 32 | 40 | 48 | 56 => {
  if (size <= 16) return 16;
  if (size <= 20) return 20;
  if (size <= 24) return 24;
  if (size <= 32) return 32;
  if (size <= 40) return 40;
  if (size <= 48) return 48;
  return 56;
};

// Utility to map any size to valid crypto-icons sizes
// For React/Web (returns strings with "px")
export const getValidCryptoIconSize = (
  size: number,
): "16px" | "20px" | "24px" | "32px" | "40px" | "48px" | "56px" => {
  if (size <= 16) return "16px";
  if (size <= 20) return "20px";
  if (size <= 24) return "24px";
  if (size <= 32) return "32px";
  if (size <= 40) return "40px";
  if (size <= 48) return "48px";
  return "56px";
};
