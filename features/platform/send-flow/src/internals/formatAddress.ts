type FormatAddressOptions = {
  prefixLength?: number;
  suffixLength?: number;
  separator?: string;
  threshold?: number;
};

export function formatAddress(address: string, options: FormatAddressOptions = {}): string {
  const {
    prefixLength = 4,
    suffixLength = 4,
    separator = "...",
    threshold = prefixLength + separator.length + suffixLength,
  } = options;

  if (!address || address.length <= threshold) {
    return address;
  }

  return `${address.slice(0, prefixLength)}${separator}${address.slice(-suffixLength)}`;
}
