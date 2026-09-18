import BigNumber from "bignumber.js";
import type { TransactionLogAPI } from "./types";

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

/**
 * topic0 of `Transfer(address,address,uint256)` — keccak256 of the event signature.
 * Every TRC20 transfer emits it, including the ones minted from a contract's constructor.
 */
export const TRC20_TRANSFER_EVENT_TOPIC =
  "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** topic0 of `Approval(address,address,uint256)`. */
export const TRC20_APPROVAL_EVENT_TOPIC =
  "8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

/** The kind of token event a TronGrid TRC20 record stands for. */
export type Trc20EventKind = "Transfer" | "Approval";

const TRC20_EVENT_TOPICS: Record<Trc20EventKind, string> = {
  Transfer: TRC20_TRANSFER_EVENT_TOPIC,
  Approval: TRC20_APPROVAL_EVENT_TOPIC,
};

/** A `uint256` event value occupies exactly one 32-byte ABI slot. */
const UINT256_HEX_LENGTH = 64;

/**
 * Event logs carry addresses EVM-style — 20 bytes, no `41` prefix, and left-padded to 32 bytes
 * inside a topic. TRON hex addresses keep the prefix, so put it back on the trailing 20 bytes.
 */
const toTronHexAddress = (hexAddress: string): string => {
  const clean = hexAddress.toLowerCase().replace(/^0x/, "");
  if (clean.length < 40 || !HEX_REGEX.test(clean)) return "";
  return "41" + clean.slice(-40);
};

type Trc20TokenEventLog = {
  /** TRON hex address (`41` + 20 bytes) of the token contract that emitted the event. */
  contractAddress: string;
  from: string;
  to: string;
};

const decodeTrc20TokenEventLog = (
  log: TransactionLogAPI,
  expectedTopic: string,
): Trc20TokenEventLog | null => {
  const [topic, fromTopic, toTopic] = log.topics ?? [];
  if (topic?.toLowerCase() !== expectedTopic) return null;
  if (!fromTopic || !toTopic || !log.address) return null;

  const contractAddress = toTronHexAddress(log.address);
  const from = toTronHexAddress(fromTopic);
  const to = toTronHexAddress(toTopic);
  if (!contractAddress || !from || !to) return null;

  return { contractAddress, from, to };
};

export type Trc20TransferLog = Trc20TokenEventLog & { amount: BigNumber };

/**
 * Decodes a `Transfer(address,address,uint256)` event log: the token contract, both parties and
 * the amount. Returns null for any other event.
 */
export const decodeTrc20TransferLog = (log: TransactionLogAPI): Trc20TransferLog | null => {
  const event = decodeTrc20TokenEventLog(log, TRC20_TRANSFER_EVENT_TOPIC);
  if (!event) return null;

  // An amount that is not exactly one ABI slot is not a `uint256` this event can carry: the log is
  // malformed (or forged by the contract), and parsing it anyway would fabricate a transfer amount.
  const data = (log.data ?? "").replace(/^0x/, "");
  if (data.length !== UINT256_HEX_LENGTH || !HEX_REGEX.test(data)) return null;

  const amount = new BigNumber(data, 16);
  if (amount.isNaN()) return null;

  return { ...event, amount };
};

/**
 * Recovers the TRC20 contract address of one TronGrid record from a transaction's event logs.
 *
 * The logs are the one source that holds it in every case: a transfer minted inside a contract's
 * constructor (`CreateSmartContract`) has no `contract_address` parameter to read it from, and an
 * unindexed token has no TronGrid `token_info.address` either — but the event is always emitted by
 * the token contract itself.
 *
 * The record's own event kind and both parties select the log: one transaction can approve token A
 * while transferring token B, and an `Approval`'s owner/spender say nothing about which token
 * moved. So only an event of the record's kind, between the record's parties, and naming a single
 * token resolves; anything else returns undefined rather than guessing.
 *
 * @param event the record to resolve: its event kind and its two parties, as TRON hex addresses
 * @returns the TRON hex address (`41` + 20 bytes) of the token contract, or undefined
 */
export const trc20ContractAddressFromLogs = (
  logs: TransactionLogAPI[] | undefined,
  event: { kind: Trc20EventKind; from?: string; to?: string },
): string | undefined => {
  // Without both parties the record cannot be correlated to a log at all.
  if (!event.from || !event.to) return undefined;

  const addresses = new Set(
    (logs ?? [])
      .map(log => decodeTrc20TokenEventLog(log, TRC20_EVENT_TOPICS[event.kind]))
      .filter((decoded): decoded is Trc20TokenEventLog => decoded !== null)
      .filter(decoded => decoded.from === event.from && decoded.to === event.to)
      .map(decoded => decoded.contractAddress),
  );

  return addresses.size === 1 ? addresses.values().next().value : undefined;
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");
