import { getEnv } from "@ledgerhq/live-env";
import { ExchangeProviderNameAndSignature } from ".";

const testSellProvider: ExchangeProviderNameAndSignature = {
  name: "SELL_TEST",
  publicKey: {
    curve: "secp256k1",
    data: Buffer.from(
      "0478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3",
      "hex",
    ),
  },
  signature: Buffer.from(
    "30440220471b035b40dafa095d615998c82202b2bd00fb45670b828f1dda3b68e5b24cc3022022a1c64d02b8c14e1e4cc2d05b00234642c11db3d4461ff5366f5af337cf0ced",
    "hex",
  ),
  version: 2,
};

const sellProviders: Record<string, ExchangeProviderNameAndSignature> = {
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

export const getSellProvider = (providerName: string): ExchangeProviderNameAndSignature => {
  if (getEnv("MOCK_EXCHANGE_TEST_CONFIG")) {
    return testSellProvider;
  }

  const res = sellProviders[providerName.toLowerCase()];

  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return res;
};
