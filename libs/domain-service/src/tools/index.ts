/**
 * Helper designed to parse the APDU crafted by the Ledger backend to clear sign domains.
 * The APDU is encoded with a TLV scheme: https://en.wikipedia.org/wiki/Type%E2%80%93length%E2%80%93value
 * This is not used in our implementation per say, use this purely as a debug tool.
 */

// List of TLV possible based on the `Nano Trusted Names Descriptor Format & APIs` architecture on our confluence.
// Sorry about that open source people.
type TLV_TYPES =
  | "STRUCTURE_TYPE"
  | "VERSION"
  | "CHALLENGE"
  | "SIGNER_KEY_ID"
  | "SIGNER_ALGO"
  | "TRUSTED_NAME"
  | "COIN_TYPE"
  | "ADDRESS"
  | "SIGNATURE";
type TLV_IDS = "01" | "02" | "12" | "13" | "14" | "15" | "20" | "21" | "22";

const TLVs: Record<
  TLV_IDS,
  { typeName: TLV_TYPES; parser: (input: string) => string | number }
> = {
  "01": { typeName: "STRUCTURE_TYPE", parser: (input) => parseInt(input, 16) },
  "02": { typeName: "VERSION", parser: (input) => parseInt(input, 16) },
  "12": { typeName: "CHALLENGE", parser: (input) => input },
  "13": { typeName: "SIGNER_KEY_ID", parser: (input) => input },
  "14": { typeName: "SIGNER_ALGO", parser: (input) => input },
  "20": {
    typeName: "TRUSTED_NAME",
    parser: (input) => Buffer.from(input, "hex").toString(),
  },
  "21": { typeName: "COIN_TYPE", parser: (input) => parseInt(input, 16) },
  "22": { typeName: "ADDRESS", parser: (input) => `0x${input}` },
  "15": { typeName: "SIGNATURE", parser: (input) => input },
};

/**
 * Parser logic
 */
export const tlvParser = (
  apdu: string
): { T: TLV_TYPES; L: string; V: string | number | null }[] => {
  const parsedApdu: { T: TLV_TYPES; L: string; V: string | number | null }[] =
    [];

  let apduLeft = apdu;
  while (apduLeft.length > 0) {
    const type = apduLeft.substring(0, 2) as TLV_IDS;
    const TLV = TLVs[type] || {};

    const lengthByte = apduLeft.substring(2, 4);
    // documentation to explain DER integer encoding
    // @see https://learn.microsoft.com/en-us/windows/win32/seccertenroll/about-integer
    const isLengthDEREncodedInt = !!(parseInt(lengthByte, 16) >> 7); // check if the high bit of the 7 bits number a 1 ?

    if (isLengthDEREncodedInt) {
      const lengthByteLast6Bits = parseInt(lengthByte, 16) & 0x3f; // 0x3F === "111111" so this will return the last 6 bits of the DER encoded integer
      const lengthSizeInBytes = parseInt(lengthByteLast6Bits.toString(16), 10); // length size in bytes as decimal
      const offset = 4 + lengthSizeInBytes * 2; // we'll have to take the number of bytes for the size into account to not consider it as part of the Value of th TLV
      const length = parseInt(apduLeft.substring(4, offset), 16); // the actual length of the Value
      const lengthInChars = length * 2;
      const value = apduLeft.substring(offset, offset + lengthInChars);

      parsedApdu.push({
        T: TLV.typeName,
        L: length.toString(16),
        V: TLV.parser?.(value) || null,
      });
      apduLeft = apduLeft.substring(offset + lengthInChars);
    } else {
      const lengthInChars = parseInt(lengthByte, 16) * 2;
      const value = apduLeft.substring(4, 4 + lengthInChars);

      parsedApdu.push({
        T: TLV.typeName,
        L: lengthByte,
        V: TLV.parser?.(value) || null,
      });
      apduLeft = apduLeft.substring(4 + lengthInChars);
    }
  }

  return parsedApdu;
};
