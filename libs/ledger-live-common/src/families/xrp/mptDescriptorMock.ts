// TEMP prototype: the CAL has no MPT descriptors yet. Signs them with the public app-boilerplate
// `dynamic_token` test key, which only Speculos with the test PKI (started without -p) trusts.
import { secp256k1 } from "@noble/curves/secp256k1.js";
import {
  ClearSignContextType,
  type ClearSignContext,
  type ContextModule,
} from "@ledgerhq/context-module";
import { XRP_DEV_TOKENS } from "./devTokens";

const TEST_KEY = "050c474a5459305488d6790249abb51f2b6d52cfc5c5fbc845ca2a6dd35edd62";
// Nano S Plus only: the certificate is per device model
const NANO_SP_CERTIFICATE =
  "01010102010211040000000212010013020002140101160400000000200D44796E616D69635F546F6B656E3002000E310108320121332102E3C05B637A0626AB382004A9350BEB1DE47958A3B9FC1EFC6E16A72104C05FE73401013501031546304402207756CFA4C31D0732F45FE12AD824262C1359BD49A89EE847A5322D99023E1D2802204D6B36F57BE3DD3D0FF2BBD5ECC71FAAE5D52899742673200D9F8236A58913E3";
const CERTIFICATE_KEY_USAGE = 0x08;
const MAX_DESCRIPTORS = 2;

const hexLength = (hex: string) => (hex.length / 2).toString(16).padStart(2, "0");
const tlv = (tag: string, hex: string) => tag + hexLength(hex) + hex;
const ascii = (text: string) => Buffer.from(text, "ascii").toString("hex");

const buildDescriptor = (issuanceId: string, ticker: string, decimals: number): string => {
  const body =
    tlv("01", "90") +
    tlv("02", "01") +
    tlv("03", "80000090") +
    tlv("04", ascii("XRP")) +
    tlv("05", ascii(ticker)) +
    tlv("06", decimals.toString(16).padStart(2, "0")) +
    tlv("07", tlv("10", issuanceId));
  const signature = secp256k1.sign(Buffer.from(body, "hex"), Buffer.from(TEST_KEY, "hex"), {
    format: "der",
  });

  return body + tlv("08", Buffer.from(signature).toString("hex"));
};

export const mptDescriptorMock: ContextModule = {
  getContexts: async input => {
    const { rawTransaction, deviceModelId } = input as {
      rawTransaction: Uint8Array;
      deviceModelId: string;
    };
    if (deviceModelId !== "nanoSP") return [];

    const rawHex = Buffer.from(rawTransaction).toString("hex").toUpperCase();
    const contexts = XRP_DEV_TOKENS.flatMap((token): ClearSignContext[] => {
      const issuanceId = token.tokenType === "mpt" ? token.tokenIdentifier : undefined;
      if (!issuanceId || !rawHex.includes(issuanceId)) return [];

      return [
        {
          type: ClearSignContextType.XRP_MPT_TOKEN,
          payload: buildDescriptor(issuanceId, token.ticker, token.units[0].magnitude),
          certificate: {
            keyUsageNumber: CERTIFICATE_KEY_USAGE,
            payload: Buffer.from(NANO_SP_CERTIFICATE, "hex"),
          },
        },
      ];
    });

    return contexts.slice(0, MAX_DESCRIPTORS);
  },
  getFieldContext: () => Promise.reject(new Error("mptDescriptorMock: XRP MPT descriptors only")),
  getTypedDataFilters: () =>
    Promise.reject(new Error("mptDescriptorMock: XRP MPT descriptors only")),
  report: async () => {},
};
