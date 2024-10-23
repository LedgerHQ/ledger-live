import { ResponseAddress } from "@zondax/ledger-stacks";

// TODO: sync with @qperrot to extract those in a common utils (used also in filecoin)
const validHexRegExp = new RegExp(/^(0x)?[a-fA-F0-9]+$/);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);
export const isValidHex = (msg: string) => validHexRegExp.test(msg) && msg.length % 2 === 0;
export const isValidBase64 = (msg: string) => validBase64RegExp.test(msg);
// ENDOFTODO

export const isNoErrorReturnCode = (code: number) => code === 0x9000;

export const getPath = (path: string) => (path && path.substr(0, 2) !== "m/" ? `m/${path}` : path);

export const throwIfError = (r: ResponseAddress) => {
  if (!isNoErrorReturnCode(r.returnCode)) throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);
