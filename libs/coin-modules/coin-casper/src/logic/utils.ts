import BigNumber from "bignumber.js";
import type { CasperMemo } from "../types";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;

export const getPath = (path: string): string =>
  path && !path.startsWith("m/") ? `m/${path}` : path;

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean => validBase64RegExp.test(msg);

export const isError = (r: { returnCode: number; errorMessage: string }): void => {
  if (!isNoErrorReturnCode(r.returnCode)) throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const methodToString = (method: number): string => {
  if (method === 0) return "Token transfer";
  return "Unknown";
};

export const getBufferFromString = (message: string): Buffer => {
  if (isValidHex(message)) {
    return Buffer.from(message, "hex");
  }

  if (isValidBase64(message)) {
    return Buffer.from(message, "base64");
  }

  return Buffer.from(message);
};

function randomIntFromInterval(min: number, max: number): string {
  const minBig = new BigNumber(min);
  const maxBig = new BigNumber(max);

  const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
  const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

  return randomInt.toString();
}

export function getRandomTransferID(): string {
  return randomIntFromInterval(0, Number.MAX_SAFE_INTEGER);
}

export function toSafeNumber(value: bigint): number {
  if (value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`value ${value} exceeds the safe integer range`);
  }

  return Number(value);
}

// Two memo shapes coexist until LIVE-35735 unifies them.
export function getTransferIdFromMemo(memo: CasperMemo | undefined): string | undefined {
  if (!memo) return undefined;
  if (memo.type === "string" && memo.kind === "transferId") return memo.value;
  if (memo.type === "transferId") return memo.value;
  return undefined;
}
