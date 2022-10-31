import blake2 from "blake2";
import { SMALL_BYTES_COUNT } from "../../consts";

function numberToBin(num: number) {
  return (num >>> 0).toString(2);
}

function bytesToBitsString(buf: Buffer) {
  const bitsArray: string[] = [];

  for (const num of buf) {
    const bin = numberToBin(num);
    bitsArray.push(bin);
  }

  return bitsArray.join("");
}

/**
 * Returns the bytes encoded as hexadecimal with mixed-case based checksums following a scheme
 * similar to [EIP-55](https://eips.ethereum.org/EIPS/eip-55).
 */
function encode(inputBytes: Buffer) {
  const blakeHash = blake2
    .createHash("blake2b", { digestLength: inputBytes.length })
    .update(inputBytes)
    .digest("hex");

  const nibbles = inputBytes
    .toString("hex")
    .split("")
    .map((v) => parseInt(v, 16));

  const hashBuf = Buffer.from(blakeHash, "hex");
  const bitsArray = bytesToBitsString(hashBuf);

  const res: Array<number | string> = [];

  let steamIndex = -1;
  for (const num of nibbles) {
    if (num < 10) res.push(num);
    else {
      steamIndex++;
      if (parseInt(bitsArray[steamIndex], 10))
        res.push(num.toString(16).toUpperCase());
      else res.push(num.toString(16).toLowerCase());
    }
  }

  return res.join("");
}

// Decodes a mixed-case hexadecimal string
// Checksum hex encoding for casper docs: https://docs.casperlabs.io/design/checksummed-hex/
export function decode(inputString: string): string {
  if (Buffer.from(inputString, "hex").length > SMALL_BYTES_COUNT)
    return inputString;

  if (inputString.toLowerCase() === inputString) return inputString;
  if (inputString.toUpperCase() === inputString) return inputString;

  const encoded = encode(Buffer.from(inputString, "hex"));

  for (let i = 0; i < encode.length; i++) {
    if (encoded.charAt(i) !== inputString.charAt(i))
      throw Error("Checksum invalid, decoding failed.");
  }

  return inputString;
}
