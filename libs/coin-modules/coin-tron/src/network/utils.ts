import BigNumber from "bignumber.js";

// see: https://solidity.readthedocs.io/en/v0.6.1/abi-spec.html#function-selector-and-argument-encoding
// Use toString(16) on BigNumber to preserve full uint256 precision (avoid toNumber() which is limited to 2^53).
export const abiEncodeTrc20Transfer = (address: string, amount: BigNumber): string => {
  const encodedAddress = address.padStart(64, "0");
  const hexAmount = amount.isInteger()
    ? amount.toString(16)
    : amount.integerValue(BigNumber.ROUND_FLOOR).toString(16);

  const encodedAmount = hexAmount.padStart(64, "0");
  return encodedAddress.concat(encodedAmount);
};

/**
 * Function selector for TRC20 transfer(address,uint256)
 * Computed as: keccak256("transfer(address,uint256)").slice(0, 8) = "a9059cbb"
 */
const TRC20_TRANSFER_SELECTOR = "a9059cbb";
const HEX_REGEX = /^[0-9a-fA-F]+$/;

export type Trc20TransferData = {
  to: string;
  amount: BigNumber;
};

/**
 * Decodes ABI-encoded TRC20 transfer call data into recipient address and amount.
 *
 * TRC20 transfer calls follow the Ethereum ABI encoding specification:
 * - Bytes 0-3 (4 bytes / 8 hex chars): Function selector "a9059cbb" for transfer(address,uint256)
 * - Bytes 4-35 (32 bytes / 64 hex chars): Recipient address, left-padded to 32 bytes
 * - Bytes 36-67 (32 bytes / 64 hex chars): Transfer amount as uint256, left-padded to 32 bytes
 *
 * TRON address encoding:
 * Unlike standard EVM (20-byte addresses), TRON encodes addresses with the "41" prefix included,
 * making them 21 bytes. The 32-byte ABI slot contains:
 * - 11 bytes (22 hex chars) of zero padding
 * - 21 bytes (42 hex chars) = "41" prefix + 20-byte address
 *
 * Example encoded data from TRON transactions:
 * ```
 * a9059cbb                                                         <- selector (8 chars)
 * 000000000000000000000041ec20315a879c48f5e3a6a1c9826d5225f8b658b8 <- address (64 chars, 21-byte TRON addr)
 * 00000000000000000000000000000000000000000000000000000000027bf24d <- amount (64 chars)
 * ```
 *
 * The slice(24) logic skips 12 bytes (24 hex chars), which removes both the zero padding (11 bytes)
 * AND the "41" prefix byte. We then prepend "41" back to produce a valid TRON hex address.
 *
 * @param data - Hex-encoded call data, optionally prefixed with "0x"
 * @returns Decoded transfer data with TRON-format recipient address (41 + 20 bytes) and amount, or null if invalid
 */
export const abiDecodeTrc20Transfer = (data: string): Trc20TransferData | null => {
  const has0xPrefix = data.toLowerCase().startsWith("0x");
  const cleanData = has0xPrefix ? data.slice(2) : data;

  // Minimum length: 8 (selector) + 64 (address) + 64 (amount) = 136 hex chars
  if (cleanData.length < 8 + 64 + 64) return null;
  // ABI data represents bytes, so must be even length
  if (cleanData.length % 2 !== 0) return null;
  if (!HEX_REGEX.test(cleanData)) return null;

  const selector = cleanData.slice(0, 8).toLowerCase();
  if (selector !== TRC20_TRANSFER_SELECTOR) return null;

  // Extract address parameter (64 hex chars = 32 bytes)
  const toHex = cleanData.slice(8, 72);
  const amountHex = cleanData.slice(72, 136);

  // Skip 12 bytes (24 hex chars) of padding + "41" prefix, extract 20-byte address
  const addressHex = toHex.slice(24);
  if (addressHex.length !== 40) return null;

  // Reconstruct TRON address: "41" prefix + 20-byte address
  const to = "41" + addressHex;
  const amount = new BigNumber(amountHex, 16);
  if (amount.isNaN()) return null;

  return { to, amount };
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");
