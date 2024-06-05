import { ExchangeProviderNameAndSignature } from ".";
import { isIntegrationTestEnv } from "../swap/utils/isIntegrationTestEnv";

export type SwapProviderConfig = {
  needsKYC: boolean;
  needsBearerToken: boolean;
};

type CEXProviderConfig = ExchangeProviderNameAndSignature & SwapProviderConfig & { type: "CEX" };
type DEXProviderConfig = SwapProviderConfig & { type: "DEX" };
type AdditionalProviderConfig = SwapProviderConfig & { type: "DEX" | "CEX" } & {
  version?: number;
  needsBearerToken: boolean;
  needsKYC: boolean;
};
export type ProviderConfig = CEXProviderConfig | DEXProviderConfig;

const swapAdditionData: Record<string, AdditionalProviderConfig> = {
  changelly: {
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
  },
  cic: {
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
  },
  moonpay: {
    needsKYC: true,
    needsBearerToken: false,
    type: "CEX",
    version: 2,
  },
  oneinch: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
  },
  paraswap: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
  },
};

const swapProviders: Record<string, ProviderConfig & AdditionalProviderConfig> = {
  changelly: {
    name: "Changelly",
    publicKey: {
      curve: "secp256k1",
      data: Buffer.from(
        "0480d7c0d3a9183597395f58dda05999328da6f18fabd5cda0aff8e8e3fc633436a2dbf48ecb23d40df7c3c7d3e774b77b4b5df0e9f7e08cf1cdf2dba788eb085b",
        "hex",
      ),
    },
    signature: Buffer.from(
      "3045022100e73339e5071b5d232e8cacecbd7c118c919122a43f8abb8b2062d4bfcd58274e022050b11605d8b7e199f791266146227c43fd11d7645b1d881f705a2f8841d21de5",
      "hex",
    ),
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
  },
  cic: {
    name: "CIC",
    publicKey: {
      curve: "secp256k1",
      data: Buffer.from(
        "0444a71652995d15ef0d4d6fe8de21a0c8ad48bdbfea7f789319973669785ca96abca9fd0c504c3074d9b654f0e3a76dde642a03efe4ccdee3af3ca4ba4afa202d",
        "hex",
      ),
    },
    signature: Buffer.from(
      "3044022078a73433ab6289027b7a169a260f180d16346f7ab55b06a22109f68a756d691d0220190edd6e1214c3309dc1b0afe90d217b728377491561383f2ee543e2c90188eb",
      "hex",
    ),
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
  },
  moonpay: {
    name: "moonpay",
    publicKey: {
      curve: "secp256k1",
      data: Buffer.from(
        "044989cad389020fadfb9d7a85d29338a450beec571347d2989fb57b99ecddbc8907cf8c229deee30fb8ac139e978cab8f6efad76bde2a9c6d6710ceda1fe0a4d8",
        "hex",
      ),
    },
    signature: Buffer.from(
      "304402202ea20dd1a67185a14503f073a387ec22564cc06bbb2545444efc929d69c70d1002201622ac8e34a7f332ac50d67c1d9221dcc3334ad7c1fb84e674654cd306bbda73",
      "hex",
    ),
    needsKYC: true,
    needsBearerToken: false,
    type: "CEX",
    version: 2,
  },
  oneinch: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
  },
  paraswap: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
  },
};

let providerDataCache: Record<string, ProviderConfig & AdditionalProviderConfig> | null = null;

export const getSwapProvider = async (
  providerName: string,
): Promise<ProviderConfig & AdditionalProviderConfig> => {
  const res = await fetchAndMergeProviderData();

  if (!res[providerName.toLowerCase()]) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return res[providerName.toLowerCase()];
};

function transformData(providersData) {
  const transformed = {};
  providersData.forEach(provider => {
    const key = provider.name.toLowerCase();
    transformed[key] = {
      name: provider.name,
      publicKey: {
        curve: provider.public_key_curve,
        data: Buffer.from(provider.public_key, "hex"),
      },
      signature: Buffer.from(provider.signature, "hex"),
    };
  });
  return transformed;
}

export const getProvidersData = async () => {
  try {
    const providersData = await (
      await fetch(
        "https://crypto-assets-service.api.aws.prd.ldg-tech.com/v1/partners?output=name,payload_signature_computed_format,signature,public_key,public_key_curve",
      )
    ).json();
    return providersData;
  } catch {
    return swapProviders;
  }
};

export const getProvidersCDNData = async () => {
  try {
    const providersData = await (
      await fetch("https://cdn.live.ledger.com/swap-providers/data.json")
    ).json();
    return providersData;
  } catch {
    return swapAdditionData;
  }
};

const fetchAndMergeProviderData = async () => {
  if (providerDataCache) {
    return providerDataCache;
  }

  try {
    const [providersData, providersExtraData] = await Promise.all([
      getProvidersData(),
      getProvidersCDNData(),
    ]);

    const transformedProvidersData = transformData(providersData);
    const finalProvidersData = mergeProviderData(transformedProvidersData, providersExtraData);
    providerDataCache = finalProvidersData;

    return finalProvidersData;
  } catch (error) {
    console.error("Error fetching or processing provider data:", error);
    const transformedProvidersData = transformData(swapProviders);
    const finalProvidersData = mergeProviderData(transformedProvidersData, swapAdditionData);
    providerDataCache = finalProvidersData;

    return finalProvidersData;
  }
};

function mergeProviderData(baseData, additionalData) {
  const mergedData = { ...baseData };
  Object.keys(additionalData).forEach(key => {
    mergedData[key] = {
      ...mergedData[key],
      ...additionalData[key],
    };
  });
  return mergedData;
}

export const getAvailableProviders = (): string[] => {
  if (isIntegrationTestEnv()) {
    return Object.keys(swapProviders).filter(p => p !== "changelly");
  }
  return Object.keys(swapProviders);
};
