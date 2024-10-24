import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";

const CAL_BASE_URL = getEnv("CAL_SERVICE_URL");

export type PartnerType = {
  continuesInProviderLiveApp: boolean;
  displayName: string;
  mainUrl: string;
  needsKYC: boolean;
  supportUrl: string;
  termsOfUseUrl: string;
  type: "CEX" | "DEX";
  version?: number;
};

export async function getProvidersCDNData(): Promise<Record<string, PartnerType>> {
  const { data: providers } = await network<Record<string, PartnerType>>({
    url: "https://cdn.live.ledger.com/swap-providers/data.json",
  });

  return providers;
}

export type ExchangeProvider = {
  name: string;
  publicKey: {
    curve: "secp256k1" | "secp256r1";
    data: Buffer;
  };
  version?: number;
  signature: Buffer;
};
// Exported for test purpose only
export type ProvidersDataResponse = {
  name: string;
  public_key: string;
  public_key_curve: string;
  service_app_version: number;
  descriptor: {
    data: string;
    signatures: {
      prod: string;
      test: string;
    };
  };
}[];

// Exported for test purpose only
export function transformData(
  providersData: ProvidersDataResponse,
  env: "prod" | "test",
): Record<string, ExchangeProvider> {
  const transformed = {};
  providersData.forEach(provider => {
    const key = provider.name.toLowerCase();
    transformed[key] = {
      name: provider.name,
      publicKey: {
        curve: provider.public_key_curve,
        data: Buffer.from(provider.public_key, "hex"),
      },
      version: provider.service_app_version,
      signature: Buffer.from(provider.descriptor.signatures[env], "hex"),
    };
  });
  return transformed;
}

export async function getProvidersData(
  type: "swap" | "fund" | "sell",
  env: "prod" | "test" = "prod",
): Promise<Record<string, ExchangeProvider>> {
  const { data: providersData } = await network<ProvidersDataResponse>({
    method: "GET",
    url: `${CAL_BASE_URL}/v1/partners`,
    params: {
      output: "name,public_key,public_key_curve,service_app_version,descriptor",
      service_name: type,
    },
  });

  return transformData(providersData, env);
}
