import { getEnv } from "@ledgerhq/live-env";
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

const fundProviders: Record<string, ExchangeProviderNameAndSignature> = {
  baanx: {
    name: "Baanx",
    publicKey: {
      curve: "secp256r1",
      data: Buffer.from(
        "04551878b446b6a711949fa51cc5a8685602f8ffb1dfd08f6ab869019d7c125d7737a79e8b5022d860ec7dfbe062d510fec3b5fe0f6ebb1f5e55a074bb7e5dbc4e",
        "hex",
      ),
    },
    signature: Buffer.from(
      "304402200345c39e93a22c5ac3f1e70f8b9938b3a60d3a4906067443cf11095af0e685a502201ee5d88dd5539ce36341e49e2505c2a1659e26d8ff08801ed33c50a9126aedd1",
      "hex",
    ),
  },
  youhodler: {
    name: "Youhodler",
    publicKey: {
      curve: "secp256r1",
      data: Buffer.from(
        "0471e9a38549562e7e49c2dc079f1350c75b42b5de23104572dbf0d7d2753d1581a246a8bd6e72257f450c023972ad2190c70b468e133648a47e87cce08d17047d",
        "hex",
      ),
    },
    signature: Buffer.from(
      "304402207e18ad4540f47a86f7f4d40db3b9ca21a42026b37e404ef528a0e150ce88098e02206c05b27b66bef58e9a056152ef280077a8d7583260cb94c574a3074b2681ff6a",
      "hex",
    ),
  },
  uquid: {
    name: "Uquid",
    publicKey: {
      curve: "secp256r1",
      data: Buffer.from(
        "02f96aa3d99d5ec6ce060808fd99c958c17f23e6cb9c1cf81d6419e11677410d04",
        "hex",
      ),
    },
    signature: Buffer.from(
      "3045022100c24ad1df500551b901ebeaeb133cdfd23fcc498ca08637bc9793ecc6485aa79902207152856487f6ed74faabded16fcae07eaf47d84a155db8aaec3fd066e27cbf38",
      "hex",
    ),
  },
};

export const getFundProvider = (providerName: string): ExchangeProviderNameAndSignature => {
  if (getEnv("MOCK_EXCHANGE_TEST_CONFIG")) {
    return testFundProvider;
  }

  const res = fundProviders[providerName.toLowerCase()];

  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return res;
};
