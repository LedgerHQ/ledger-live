import { createHash } from "node:crypto";
import { decodeBase58, encodeBase58 } from "ethers";

/** USDT (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t), the token a Tronify rent is paid in. */
export const USDT_CONTRACT_HEX = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";

const TRIGGER_SMART_CONTRACT = 31;
const TRIGGER_SMART_CONTRACT_TYPE_URL = "type.googleapis.com/protocol.TriggerSmartContract";
const TRC20_TRANSFER_SELECTOR = "a9059cbb";

export type RentPaymentFields = {
  ownerHex: string;
  payeeHex: string;
  amountBaseUnits: bigint;
  refBlockBytes: string;
  refBlockHash: string;
  expiration: number;
  timestamp: number;
  feeLimit: number;
  memo?: string;
  permissionId?: number;
};

const sha256 = (bytes: Uint8Array): Buffer => createHash("sha256").update(bytes).digest();

const fromHex = (hex: string): Buffer => Buffer.from(hex, "hex");

function varint(value: number | bigint): Buffer {
  const bytes: number[] = [];
  let rest = BigInt(value);
  while (rest > 0x7fn) {
    bytes.push(Number(rest & 0x7fn) | 0x80);
    rest >>= 7n;
  }
  bytes.push(Number(rest));
  return Buffer.from(bytes);
}

const varintField = (field: number, value: number | bigint): Buffer =>
  Buffer.concat([varint(field << 3), varint(value)]);

const bytesField = (field: number, value: Uint8Array): Buffer =>
  Buffer.concat([varint((field << 3) | 2), varint(value.length), value]);

const abiWord = (hex: string): string => hex.padStart(64, "0");

/** `transfer(address,uint256)` call data. The address word is the 20-byte address left-padded, as
 * in Tronify's own payments. */
export function trc20TransferCallHex(payeeHex: string, amountBaseUnits: bigint): string {
  return (
    TRC20_TRANSFER_SELECTOR + abiWord(payeeHex.slice(-40)) + abiWord(amountBaseUnits.toString(16))
  );
}

/** Whether raw_data hex holds a USDT `transfer(to, amount)`, whichever way its address word is
 * padded. */
export function isUsdtTransfer(
  rawDataHex: string,
  toHex: string,
  amountBaseUnits: bigint,
): boolean {
  const hex = rawDataHex.toLowerCase();
  const call = hex.indexOf(TRC20_TRANSFER_SELECTOR);
  if (!hex.includes(USDT_CONTRACT_HEX) || call < 0) return false;
  const args = hex.slice(call + TRC20_TRANSFER_SELECTOR.length);
  if (args.length < 128) return false;
  return (
    args.slice(24, 64) === toHex.slice(-40).toLowerCase() &&
    BigInt(`0x${args.slice(64, 128)}`) === amountBaseUnits
  );
}

/** raw_data hex of a USDT `transfer(payee, amount)` from `ownerHex`, the shape of Tronify's rent
 * payments. Fields go out in field-number order and unset ones are left out, as protobuf encodes
 * them, so coin-tron's canonical-encoding check accepts the bytes. */
export function encodeRentPaymentRawData(p: RentPaymentFields): string {
  const trigger = Buffer.concat([
    bytesField(1, fromHex(p.ownerHex)),
    bytesField(2, fromHex(USDT_CONTRACT_HEX)),
    bytesField(4, fromHex(trc20TransferCallHex(p.payeeHex, p.amountBaseUnits))),
  ]);
  const parameter = Buffer.concat([
    bytesField(1, Buffer.from(TRIGGER_SMART_CONTRACT_TYPE_URL)),
    bytesField(2, trigger),
  ]);
  const contract = Buffer.concat([
    varintField(1, TRIGGER_SMART_CONTRACT),
    bytesField(2, parameter),
    ...(p.permissionId ? [varintField(5, p.permissionId)] : []),
  ]);
  return Buffer.concat([
    bytesField(1, fromHex(p.refBlockBytes)),
    bytesField(4, fromHex(p.refBlockHash)),
    varintField(8, p.expiration),
    ...(p.memo ? [bytesField(10, Buffer.from(p.memo, "utf8"))] : []),
    bytesField(11, contract),
    varintField(14, p.timestamp),
    varintField(18, p.feeLimit),
  ]).toString("hex");
}

/** A TRON txID: sha256 of the raw_data bytes. */
export function tronTxId(rawDataHex: string): string {
  return sha256(fromHex(rawDataHex)).toString("hex");
}

const checksum = (payload: Uint8Array): Buffer => sha256(sha256(payload)).subarray(0, 4);

/** TRON base58check address → 41-prefixed hex. */
export function base58ToHex(address: string): string {
  const decoded = fromHex(decodeBase58(address).toString(16).padStart(50, "0"));
  const payload = decoded.subarray(0, 21);
  if (decoded.length !== 25 || !checksum(payload).equals(decoded.subarray(21))) {
    throw new Error(`Invalid TRON address checksum: ${address}`);
  }
  return payload.toString("hex");
}

/** 41-prefixed hex → TRON base58check address. */
export function hexToBase58(hex: string): string {
  const payload = fromHex(hex);
  return encodeBase58(Buffer.concat([payload, checksum(payload)]));
}

/** raw_data hex (field 1) of a signed `Transaction`, the form `wallet/broadcasthex` receives. */
export function signedTransactionRawDataHex(signedHex: string): string {
  const bytes = fromHex(signedHex);
  if (bytes[0] !== 0x0a) throw new Error("Signed transaction does not start with raw_data");
  let length = 0;
  let offset = 1;
  for (let shift = 0; ; shift += 7) {
    const byte = bytes[offset++];
    if (byte === undefined) throw new Error("Signed transaction is truncated");
    length += (byte & 0x7f) * 2 ** shift;
    if (byte < 0x80) break;
  }
  return bytes.subarray(offset, offset + length).toString("hex");
}
