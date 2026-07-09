export function isValidAddressLabel(label: string): boolean {
  return label.trim().length > 0 && /^[\x20-\x7E]+$/.test(label);
}

export function isValidAddressValue(address: string): boolean {
  return address.trim().length > 0;
}
