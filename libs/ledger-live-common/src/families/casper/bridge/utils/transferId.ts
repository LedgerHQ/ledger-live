export function validateTransferId(id?: string): { isValid: boolean } {
  if (!id || !id.length) return { isValid: true };
  if (/^\d+$/.test(id)) return { isValid: true };

  return { isValid: false };
}
