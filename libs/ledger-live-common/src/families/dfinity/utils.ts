import { BigNumber } from "bignumber.js";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/
);

// TODO Filecoin - Use the new package @zondax/ledger-utils instead
export const isNoErrorReturnCode = (code: number) => code === 0x9000;

export const getPath = (path: string) =>
  path && path.substr(0, 2) !== "m/" ? `m/${path}` : path;

export const isValidHex = (msg: string) => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string) => validBase64RegExp.test(msg);

export const isError = (r: { returnCode: number; errorMessage?: string }) => {
  if (!isNoErrorReturnCode(r.returnCode))
    throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const methodToString = (method: number): string => {
  switch (method) {
    case 0:
      return "Transfer";
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

export const calculateEstimatedFees = (
  gasFeeCap: BigNumber,
  gasLimit: BigNumber
): BigNumber => gasFeeCap.multipliedBy(gasLimit);

export const normalizeEpochTimestamp = (timestamp: number): number => {
  return timestamp / 1e3;
};

export const validateMemo = (_memo: BigInt) => {
  return {isValid: true} // TODO: Implement validation
}
