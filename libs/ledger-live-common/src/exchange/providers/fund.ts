import calService from "@ledgerhq/ledger-cal-service";
import { ExchangeProviderNameAndSignature } from ".";

const testFundProvider: ExchangeProviderNameAndSignature = {
  name: "FUND_TEST",
  publicKey: {
    curve: "secp256r1",
    data: Buffer.from(
      "0400beef98b4b2994f688fd98b565e171ec9259c890614d2dba6105202018e3a764aa6683ea116c9e0e3c801ca5ab972a2f8f79f906e19f73edb914500ead02d70",
      "hex",
    ),
  },
  signature: Buffer.from(
    "304402203c1ce9eaf21a18803ea9876fab8f8a24b0d6e5f26ef754f2d1a0ac3424fcb8e102204f6c92cfec8f232c1b1489882f98070fe3e20084d023d653e3eef696bca02778",
    "hex",
  ),
};

export const getFundProvider = async ({
  providerId,
  ledgerSignatureEnv,
  partnerSignatureEnv,
}: {
  providerId: string;
  ledgerSignatureEnv: "prod" | "test" | undefined;
  partnerSignatureEnv: "prod" | "test" | undefined;
}): Promise<ExchangeProviderNameAndSignature> => {
  if (ledgerSignatureEnv === "test") {
    return testFundProvider;
  }

  const res = await calService.getProvidersData({
    type: "fund",
    ledgerSignatureEnv,
    partnerSignatureEnv,
  });

  if (!res) {
    throw new Error("Failed to fetch fund provider data");
  }

  const provider = res[providerId];

  if (!provider) {
    throw new Error(`Unknown fund partner ${providerId}`);
  }

  return provider;
};
