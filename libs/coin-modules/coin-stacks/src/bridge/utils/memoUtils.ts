import { log } from "@ledgerhq/logs";
import { bufferCV, deserializeCV, cvToJSON, someCV, noneCV } from "@stacks/transactions";

/**
 * Converts a memo string to a buffer Clarity Value for sending in transactions
 * 
 * @param memo - The memo to convert
 * @returns Clarity Value representing the memo (some(buffer) or none)
 */
export const memoToBufferCV = (memo?: any) => {
  if (memo === undefined || memo === null || memo === "") {
    return noneCV();
  }
  return someCV(bufferCV(Buffer.from(String(memo))));
};

/**
 * Converts a hex string (from memo) to a readable string
 * 
 * @param memoHex - Hex string representation of memo
 * @returns Readable string or empty string if conversion fails
 */
export const hexMemoToString = (memoHex?: string): string => {
  if (memoHex?.substring(0, 2) === "0x") {
    try {
      // eslint-disable-next-line no-control-regex
      return Buffer.from(memoHex.substring(2), "hex").toString().replace(/\x00/g, "");
      // NOTE: couldn't use replaceAll because it's not supported in node 14
    } catch (e) {
      log("error", "Failed to convert hex memo to string", e);
    }
  }
  return "";
};

/**
 * Converts a Clarity Value memo to readable string
 * Used when processing incoming transactions
 * 
 * @param memoJson - The memo Clarity Value from a transaction
 * @returns Readable string or undefined if conversion fails
 */
export const bufferMemoToString = (memoJson: any): string | undefined => {
  let memo: string | undefined = undefined;

  // If memo is a buffer type, try to convert to string if it contains valid printable chars
  if (
    memoJson &&
    memoJson.type &&
    memoJson.type.startsWith("(buff ") &&
    memoJson.value &&
    typeof memoJson.value === "string" &&
    memoJson.value.startsWith("0x")
  ) {
    try {
      const buffer = Buffer.from(memoJson.value.substring(2), "hex");
      const str = buffer.toString();

      // Check if string contains only printable characters
      if (/^[\x20-\x7E]*$/.test(str)) {
        memo = str;
      }
    } catch (e) {
      // Keep original memo value if conversion fails
      log("error", "Failed to convert memo buffer to string", e);
    }
  }

  return memo;
};

/**
 * Processes a memo CV hex string from a transaction
 * 
 * @param memoHex - Hex string of serialized Clarity Value memo
 * @returns Readable string or undefined if conversion fails
 */
export const processMemoCV = (memoHex?: string): string | undefined => {
  if (!memoHex) return undefined;
  
  try {
    const deserialized = deserializeCV(memoHex);
    const memoJson = cvToJSON(deserialized).value;
    return bufferMemoToString(memoJson);
  } catch (e) {
    log("error", "Failed to process memo CV", e);
    return undefined;
  }
}; 