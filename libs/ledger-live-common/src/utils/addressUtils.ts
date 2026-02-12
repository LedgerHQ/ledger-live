export type FormatAddressOptions = {
  prefixLength?: number;
  suffixLength?: number;
  separator?: string;
  threshold?: number;
};

/**
 * Format an address for display by showing a shortened version with ellipsis.
 *
 * @param address - The address string to format
 * @param options - Optional configuration
 * @param options.prefixLength - Number of characters at the start (default: 4)
 * @param options.suffixLength - Number of characters at the end (default: 4)
 * @param options.separator - Ellipsis string (default: "...")
 * @param options.threshold - Minimum length before truncating (default: prefixLength + separator.length + suffixLength)
 * @returns Formatted address string (e.g. "0x1234...5678")
 */
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

/**
 * Split an address into start, middle, and end sections
 *
 * @param address - The address string to split
 * @param size - The number of characters to include in the start and end sections
 * @returns An object containing the start, middle, and end portions of the address
 * @example
 * addressSplit("HelloWorld", 2) // => { start: "He", middle: "lloWor", end: "ld" }
 */
export function addressSplit(
  address: string,
  size: number,
): { start: string; middle: string; end: string } {
  if (!address) {
    return { start: "", middle: "", end: "" };
  }

  if (size < 0) {
    return { start: "", middle: address, end: "" };
  } else if (size === 0) {
    return { start: "", middle: address, end: "" };
  }

  // Handle edge case of address length smaller than or equal to size * 2
  // In this case, we can't extract both start and end without overlapping
  if (address.length <= size * 2) {
    const halfLength = Math.floor(address.length / 2);
    return {
      start: address.slice(0, halfLength),
      middle: "",
      end: address.slice(halfLength),
    };
  }

  const start = address.slice(0, size);
  const end = address.slice(-size);
  const middle = address.slice(size, -size);

  return { start, middle, end };
}
