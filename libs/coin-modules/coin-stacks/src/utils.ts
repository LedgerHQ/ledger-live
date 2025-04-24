import { ResponseAddress } from "@zondax/ledger-stacks";

/**
 * Regular expression that validates hexadecimal strings
 * Matches strings that are entirely composed of hex characters (0-9, a-f, A-F)
 * Optionally allows 0x prefix
 */
const validHexRegExp = new RegExp(/^(0x)?[a-fA-F0-9]+$/);

/**
 * Regular expression that validates base64 strings
 * Matches strings in standard base64 format with proper padding
 */
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

/**
 * Checks if a string is a valid hexadecimal value
 * @param msg - The string to validate
 * @returns True if the string is a valid hex string with even length
 */
export const isValidHex = (msg: string) => validHexRegExp.test(msg) && msg.length % 2 === 0;

/**
 * Checks if a string is valid base64 format
 * @param msg - The string to validate
 * @returns True if the string is a valid base64 string
 */
export const isValidBase64 = (msg: string) => validBase64RegExp.test(msg);

/**
 * Checks if a return code indicates success (0x9000)
 * @param code - The return code to check
 * @returns True if the code is the success code (0x9000)
 */
export const isNoErrorReturnCode = (code: number) => code === 0x9000;

/**
 * Ensures a derivation path has the proper "m/" prefix
 * @param path - The derivation path to normalize
 * @returns The path with "m/" prefix if needed
 */
export const getPath = (path: string) => (path && path.substr(0, 2) !== "m/" ? `m/${path}` : path);

/**
 * Throws an error if the response contains an error code
 * @param r - The response from the Ledger device
 * @throws Error with the error code and message if the response has an error
 */
export const throwIfError = (r: ResponseAddress) => {
  if (!isNoErrorReturnCode(r.returnCode)) throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

/**
 * Converts a string to a Buffer based on its format
 * @param message - The string to convert (hex, base64, or plain text)
 * @returns A Buffer representation of the input string
 */
export const getBufferFromString = (message: string): Buffer => {
  if (isValidHex(message)) {
    // Remove 0x prefix if present
    const hexString = message.startsWith('0x') ? message.slice(2) : message;
    return Buffer.from(hexString, "hex");
  } else if (isValidBase64(message)) {
    return Buffer.from(message, "base64");
  } else {
    return Buffer.from(message);
  }
};
