import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { AdditionalProviderConfig, SWAP_DATA_CDN } from "../exchange/providers/swap";

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

export function getProvidersCDNData(): Record<string, AdditionalProviderConfig> {
  return SWAP_DATA_CDN;
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
  partner_id: string;
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
  ledgerSignatureEnv: "prod" | "test" = "prod",
): Record<string, ExchangeProvider> {
  const transformed = {};
  providersData.forEach(provider => {
    const key = provider.partner_id;
    transformed[key] = {
      name: provider.name,
      publicKey: {
        curve: provider.public_key_curve,
        data: Buffer.from(provider.public_key, "hex"),
      },
      version: provider.service_app_version,
      signature: Buffer.from(provider.descriptor.signatures[ledgerSignatureEnv], "hex"),
    };
  });
  return transformed;
}

export async function getProvidersData({
  type,
  partnerSignatureEnv = "prod",
  ledgerSignatureEnv = "prod",
}: {
  type: "swap" | "fund" | "sell";
  partnerSignatureEnv?: "test" | "prod";
  ledgerSignatureEnv?: "test" | "prod";
}): Promise<Record<string, ExchangeProvider>> {
  const { data: providersData } = await network<ProvidersDataResponse>({
    method: "GET",
    url: `${CAL_BASE_URL}/v1/partners`,
    params: {
      output: "name,public_key,public_key_curve,service_app_version,descriptor,partner_id,env",
      service_name: type,
      env: partnerSignatureEnv,
    },
  });

  return transformData(providersData, ledgerSignatureEnv);
}
