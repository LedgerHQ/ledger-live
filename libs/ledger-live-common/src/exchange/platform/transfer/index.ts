import {
  createExchangeProviderNameAndSignature,
  ExchangeProviderNameAndSignature,
} from "../..";
import { getEnv } from "../../../env";
import { ExchangeTypes } from "@ledgerhq/hw-app-exchange";
// FIXME: to be move in this file alongide 'fundProviders' once 'src/exchange/sell/' is deprecated
import { sellProviders } from "../../sell";

const testFundProvider = {
  nameAndPubkey: Buffer.from([
    0x9, 0x46, 0x55, 0x4e, 0x44, 0x5f, 0x54, 0x45, 0x53, 0x54, 0x4, 0x0, 0xbe,
    0xef, 0x98, 0xb4, 0xb2, 0x99, 0x4f, 0x68, 0x8f, 0xd9, 0x8b, 0x56, 0x5e,
    0x17, 0x1e, 0xc9, 0x25, 0x9c, 0x89, 0x6, 0x14, 0xd2, 0xdb, 0xa6, 0x10, 0x52,
    0x2, 0x1, 0x8e, 0x3a, 0x76, 0x4a, 0xa6, 0x68, 0x3e, 0xa1, 0x16, 0xc9, 0xe0,
    0xe3, 0xc8, 0x1, 0xca, 0x5a, 0xb9, 0x72, 0xa2, 0xf8, 0xf7, 0x9f, 0x90, 0x6e,
    0x19, 0xf7, 0x3e, 0xdb, 0x91, 0x45, 0x0, 0xea, 0xd0, 0x2d, 0x70,
  ]),
  signature: Buffer.from([
    0x30, 0x44, 0x2, 0x20, 0x3c, 0x1c, 0xe9, 0xea, 0xf2, 0x1a, 0x18, 0x80, 0x3e,
    0xa9, 0x87, 0x6f, 0xab, 0x8f, 0x8a, 0x24, 0xb0, 0xd6, 0xe5, 0xf2, 0x6e,
    0xf7, 0x54, 0xf2, 0xd1, 0xa0, 0xac, 0x34, 0x24, 0xfc, 0xb8, 0xe1, 0x2, 0x20,
    0x4f, 0x6c, 0x92, 0xcf, 0xec, 0x8f, 0x23, 0x2c, 0x1b, 0x14, 0x89, 0x88,
    0x2f, 0x98, 0x7, 0xf, 0xe3, 0xe2, 0x0, 0x84, 0xd0, 0x23, 0xd6, 0x53, 0xe3,
    0xee, 0xf6, 0x96, 0xbc, 0xa0, 0x27, 0x78,
  ]),
};

const fundProviders: Record<string, ExchangeProviderNameAndSignature> = {
  baanx: createExchangeProviderNameAndSignature({
    name: "Baanx",
    publicKey:
      "04551878b446b6a711949fa51cc5a8685602f8ffb1dfd08f6ab869019d7c125d7737a79e8b5022d860ec7dfbe062d510fec3b5fe0f6ebb1f5e55a074bb7e5dbc4e",
    signature:
      "304402200345c39e93a22c5ac3f1e70f8b9938b3a60d3a4906067443cf11095af0e685a502201ee5d88dd5539ce36341e49e2505c2a1659e26d8ff08801ed33c50a9126aedd1",
  }),
  youhodler: createExchangeProviderNameAndSignature({
    name: "Youhodler",
    publicKey:
      "0471e9a38549562e7e49c2dc079f1350c75b42b5de23104572dbf0d7d2753d1581a246a8bd6e72257f450c023972ad2190c70b468e133648a47e87cce08d17047d",
    signature:
      "304402207e18ad4540f47a86f7f4d40db3b9ca21a42026b37e404ef528a0e150ce88098e02206c05b27b66bef58e9a056152ef280077a8d7583260cb94c574a3074b2681ff6a",
  }),
  uquid: createExchangeProviderNameAndSignature({
    name: "Uquid",
    publicKey:
      "02f96aa3d99d5ec6ce060808fd99c958c17f23e6cb9c1cf81d6419e11677410d04",
    signature:
      "3045022100c24ad1df500551b901ebeaeb133cdfd23fcc498ca08637bc9793ecc6485aa79902207152856487f6ed74faabded16fcae07eaf47d84a155db8aaec3fd066e27cbf38",
  }),
};

const getProvider = (
  exchangeType: ExchangeTypes,
  providerName: string
): ExchangeProviderNameAndSignature => {
  if (getEnv("MOCK_EXCHANGE_TEST_CONFIG")) {
    return testFundProvider;
  }

  const res = (() => {
    switch (exchangeType) {
      case ExchangeTypes.Fund:
        return fundProviders[providerName.toLowerCase()];

      case ExchangeTypes.Sell:
        return sellProviders[providerName.toLowerCase()];

      default:
        return null;
    }
  })();

  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return res;
};

export { getProvider };
