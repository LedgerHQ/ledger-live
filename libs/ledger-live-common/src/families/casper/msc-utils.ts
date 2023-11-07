import BigNumber from "bignumber.js";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;

export const getPath = (path: string): string =>
  path && path.substring(0, 2) !== "m/" ? `m/${path}` : path;

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean => validBase64RegExp.test(msg);

export const isError = (r: { returnCode: number; errorMessage: string }): void => {
  if (!isNoErrorReturnCode(r.returnCode)) throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const methodToString = (method: number): string => {
  switch (method) {
    case 0:
      return "Token transfer";
    default:
      return "Unknown";
  }
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

function randomIntFromInterval(min, max): string {
  const minBig = new BigNumber(min);
  const maxBig = new BigNumber(max);

  const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
  const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

  return randomInt.toString();
}

export function getRandomTransferID(): string {
  return randomIntFromInterval(0, Number.MAX_SAFE_INTEGER);
}
