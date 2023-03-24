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

export const tlvParser = (
  apdu: string
): { T: TLV_TYPES; L: string; V: string | number | null }[] => {
  const parsedApdu: { T: TLV_TYPES; L: string; V: string | number | null }[] =
    [];

  let apduLeft = apdu;
  while (apduLeft.length > 0) {
    const type = apduLeft.substring(0, 2) as TLV_IDS;
    const TLV = TLVs[type] || {};
    const length = apduLeft.substring(2, 4);
    const lengthInCaracters = parseInt(length, 16) * 2;
    const value = apduLeft.substring(4, 4 + lengthInCaracters);

    parsedApdu.push({
      T: TLV.typeName,
      L: length,
      V: TLV.parser?.(value) || null,
    });

    apduLeft = apduLeft.substring(4 + lengthInCaracters);
  }

  return parsedApdu;
};
