import { ExchangeProviderNameAndSignature } from ".";
import { isIntegrationTestEnv } from "../swap/utils/isIntegrationTestEnv";
import network from "@ledgerhq/live-network";

export type SwapProviderConfig = {
  needsKYC: boolean;
  needsBearerToken: boolean;
};

type CEXProviderConfig = ExchangeProviderNameAndSignature & SwapProviderConfig & { type: "CEX" };
type DEXProviderConfig = SwapProviderConfig & { type: "DEX" };
export type AdditionalProviderConfig = SwapProviderConfig & { type: "DEX" | "CEX" } & {
  version?: number;
  needsBearerToken: boolean;
  needsKYC: boolean;
  termsOfUseUrl: string;
  supportUrl: string;
  mainUrl: string;
};

export type ProviderConfig = CEXProviderConfig | DEXProviderConfig;

const SWAP_DATA_CDN: Record<string, AdditionalProviderConfig> = {
  changelly: {
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
    termsOfUseUrl: "https://changelly.com/terms-of-use",
    supportUrl: "https://support.changelly.com/en/support/home",
    mainUrl: "https://changelly.com/",
  },
  exodus: {
    type: "CEX",
    needsBearerToken: false,
    termsOfUseUrl: "https://www.exodus.com/legal/exodus-tos-20240219-v29.pdf",
    supportUrl: "https://www.exodus.com/contact-support/",
    mainUrl: "https://www.exodus.com/",
    needsKYC: false,
    version: 2,
  },
  cic: {
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
    termsOfUseUrl: "https://criptointercambio.com/terms-of-use",
    supportUrl: "https://criptointercambio.com/en/about",
    mainUrl: "https://criptointercambio.com/",
  },
  moonpay: {
    needsKYC: true,
    needsBearerToken: false,
    type: "CEX",
    version: 2,
    termsOfUseUrl: "https://www.moonpay.com/legal/terms_of_use_row",
    supportUrl: "https://support.moonpay.com/",
    mainUrl: "https://www.moonpay.com/",
  },
  oneinch: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
    termsOfUseUrl: "https://1inch.io/assets/1inch_network_terms_of_use.pdf",
    supportUrl: "https://help.1inch.io/en/",
    mainUrl: "https://1inch.io/",
  },
  paraswap: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
    termsOfUseUrl: "https://files.paraswap.io/tos_v4.pdf",
    supportUrl: "https://help.paraswap.io/en/",
    mainUrl: "https://www.paraswap.io/",
  },
};

const DEFAULT_SWAP_PROVIDERS: Record<string, ProviderConfig & AdditionalProviderConfig> = {
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
    termsOfUseUrl: "https://changelly.com/terms-of-use",
    supportUrl: "https://support.changelly.com/en/support/home",
    mainUrl: "https://changelly.com/",
  },
  exodus: {
    name: "exodus",
    publicKey: {
      curve: "secp256k1",
      data: Buffer.from(
        "048abacf1b1027b7c5f96d77826eada263e21d2ba8a2a037a84e0679e05d997a91ff34df181f88bdaf3521c26fb70eb028622f3afd66d0c282d5bb61da38ad76c1",
        "hex",
      ),
    },
    signature: Buffer.from(
      "30450221009278b9a6d7b69e56a7f58004072bd4ec741f4c6134ac0a0b83d42e8d246159760220317b334a465d9b056e9da5bfbccbac31d36c0b564b06c60e28d6e8b010782c3e",
      "hex",
    ),
    needsKYC: false,
    needsBearerToken: false,
    type: "CEX",
    termsOfUseUrl: "https://www.exodus.com/legal/exodus-tos-20240219-v29.pdf",
    supportUrl: "https://www.exodus.com/contact-support/",
    mainUrl: "https://www.exodus.com/",
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
    termsOfUseUrl: "https://criptointercambio.com/terms-of-use",
    supportUrl: "https://criptointercambio.com/en/about",
    mainUrl: "https://criptointercambio.com/",
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
    termsOfUseUrl: "https://www.moonpay.com/legal/terms_of_use_row",
    supportUrl: "https://support.moonpay.com/",
    mainUrl: "https://www.moonpay.com/",
  },
  oneinch: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
    termsOfUseUrl: "https://1inch.io/assets/1inch_network_terms_of_use.pdf",
    supportUrl: "https://help.1inch.io/en/",
    mainUrl: "https://1inch.io/",
  },
  paraswap: {
    type: "DEX",
    needsKYC: false,
    needsBearerToken: false,
    termsOfUseUrl: "https://files.paraswap.io/tos_v4.pdf",
    supportUrl: "https://help.paraswap.io/en/",
    mainUrl: "https://www.paraswap.io/",
  },
};

type CurrencyDataResponse = {
  id: string;
  exchange_app_config_serialized: string;
  exchange_app_signature: string;
}[];

type CurrencyData = {
  id: string;
  config: string;
  signature: string;
};

type ProvidersDataResponse = {
  name: string;
  signature: string;
  public_key: string;
  public_key_curve: string;
}[];

type ProviderData = {
  name: string;
  publicKey: {
    curve: string;
    data: Buffer;
  };
  signature: Buffer;
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

function transformData(providersData: ProvidersDataResponse): Record<string, ProviderData> {
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

export const getProvidersData = async (): Promise<Record<string, ProviderData>> => {
  const { data: providersData } = await network<ProvidersDataResponse>({
    method: "GET",
    url: "https://crypto-assets-service.api.ledger.com/v1/partners",
    params: {
      output: "name,signature,public_key,public_key_curve",
      service_name: "swap",
    },
  });

  return transformData(providersData);
};

/**
 * Retrieves the currency data for a given ID
 * @param currencyId The unique identifier for the currency.
 * @returns A promise that resolves to the currency data including ID, serialized config, and signature.
 */
export const findExchangeCurrencyData = async (currencyId: string): Promise<CurrencyData> => {
  const { data: currencyData } = await network<CurrencyDataResponse>({
    method: "GET",
    url: "https://crypto-assets-service.api.ledger.com/v1/currencies",
    params: {
      output: "id,exchange_app_config_serialized,exchange_app_signature",
      id: currencyId,
    },
  });
  if (!currencyData.length) {
    throw new Error(`Exchange, missing configuration for ${currencyId}`);
  }
  if (currencyData.length !== 1) {
    throw new Error(`Exchange, multiple configurations found for ${currencyId}`);
  }
  return {
    id: currencyData[0].id,
    config: currencyData[0].exchange_app_config_serialized,
    signature: currencyData[0].exchange_app_signature,
  } as CurrencyData;
};

export const getProvidersCDNData = async () => {
  const providersData = await network({
    url: "https://cdn.live.ledger.com/swap-providers/data.json",
  });
  return providersData.data;
};

export const fetchAndMergeProviderData = async () => {
  if (providerDataCache) {
    return providerDataCache;
  }

  try {
    const [providersData, providersExtraData] = await Promise.all([
      getProvidersData(),
      getProvidersCDNData(),
    ]);

    const finalProvidersData = mergeProviderData(providersData, providersExtraData);
    providerDataCache = finalProvidersData;

    return finalProvidersData;
  } catch (error) {
    console.error("Error fetching or processing provider data:", error);
    const finalProvidersData = mergeProviderData(DEFAULT_SWAP_PROVIDERS, SWAP_DATA_CDN);

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

export const getAvailableProviders = async (): Promise<string[]> => {
  if (isIntegrationTestEnv()) {
    return Object.keys(DEFAULT_SWAP_PROVIDERS).filter(p => p !== "changelly");
  }
  return Object.keys(await fetchAndMergeProviderData());
};
