/**
 * Format an address by showing only parts of it
 *
 * @param address - The address to format
 * @param options - Configuration options
 * @param options.prefixLength - Number of characters to show at the start (default: 4)
 * @param options.suffixLength - Number of characters to show at the end (default: 4)
 * @param options.separator - String to use as separator (default: "...")
 * @param options.threshold - Minimum length before truncating (default: calculated from other params)
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  options: {
    prefixLength?: number;
    suffixLength?: number;
    separator?: string;
    threshold?: number;
  } = {},
) => {
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
};
