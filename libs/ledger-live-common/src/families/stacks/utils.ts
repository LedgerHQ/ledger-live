import { ResponseAddress } from "@zondax/ledger-stacks";
import { isValidBase64, isValidHex } from "../filecoin/utils";

// TODO Filecoin - Use the new package @zondax/ledger-utils instead
export const isNoErrorReturnCode = (code: number) => code === 0x9000;

export const getPath = (path: string) =>
  path && path.substr(0, 2) !== "m/" ? `m/${path}` : path;

export const isError = (r: ResponseAddress) => {
  if (!isNoErrorReturnCode(r.returnCode))
    throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
    ? Buffer.from(message, "base64")
    : Buffer.from(message);
