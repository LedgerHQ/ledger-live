import { ExchangeProviderNameAndSignature } from "../";

export const sellProviders: Record<string, ExchangeProviderNameAndSignature> = {
  coinify: {
    name: "Coinify",
    publicKey: {
      curve: "secp256r1",
      data: Buffer.from(
        "04CEA7DC8B189FA0D7A5A97530B50556CB0C14079C39CD44532D7037F2B96F0FA9C2DE588E1840B351B71114EE4021FC260F790A6F2D0CDF1C3E1899CCF97D3CCB",
        "hex",
      ),
    },
    signature: Buffer.from(
      "3043021f023ecbbb1dfd44f390944bd1f6c039942943009a51ca4f134589441476651a02200cbfdf2ebe32eb0b0a88be9b1fec343ed5b230a69e65a1d15b4e34ef4206a9dd",
      "hex",
    ),
  },
};

const getProvider = (providerName: string): ExchangeProviderNameAndSignature => {
  const res = sellProviders[providerName.toLowerCase()];

  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return res;
};

export { getProvider };
