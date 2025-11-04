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
