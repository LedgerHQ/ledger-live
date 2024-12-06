import { BigNumber } from "bignumber.js";
import { ICP_SEND_TXN_TYPE, MAX_MEMO_VALUE } from "../consts";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

export const getPath = (path: string): string =>
  path && path.substr(0, 2) !== "m/" ? `m/${path}` : path;

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean => validBase64RegExp.test(msg);

export const methodToString = (method: number): string => {
  switch (method) {
    case ICP_SEND_TXN_TYPE:
      return "Send ICP";
    default:
      return "Unknown";
  }
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);

export const normalizeEpochTimestamp = (timestamp: string): number => {
  return parseInt(timestamp.slice(0, 13));
};

function randomIntFromInterval(min: any, max: any): string {
  const minBig = new BigNumber(min);
  const maxBig = new BigNumber(max);

  const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
  const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

  return randomInt.toString();
}

export function getRandomTransferID(): string {
  return randomIntFromInterval(0, MAX_MEMO_VALUE);
}
