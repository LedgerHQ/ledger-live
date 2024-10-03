import { ExchangeProviderNameAndSignature } from ".";
import network from "@ledgerhq/live-network";

export type ProvidersDataResponse = {
  name: string;
  signature: string;
  public_key: string;
  public_key_curve: string;
  service_app_version: number;
}[];

export function transformData(
  providersData: ProvidersDataResponse,
): Record<string, ExchangeProviderNameAndSignature> {
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
      signature: Buffer.from(provider.signature, "hex"),
    };
  });
  return transformed;
}

export const getProvidersData = async (
  type,
): Promise<Record<string, ExchangeProviderNameAndSignature>> => {
  const { data: providersData } = await network<ProvidersDataResponse>({
    method: "GET",
    url: "https://crypto-assets-service.api.ledger.com/v1/partners",
    params: {
      output: "name,signature,public_key,public_key_curve,service_app_version",
      service_name: type,
    },
  });

  return transformData(providersData);
};
