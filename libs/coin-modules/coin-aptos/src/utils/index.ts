import { getEnv } from "@ledgerhq/live-env";

export * from "./IconGenerator";

export function endpointByCurrencyId(currencyId: string): string {
  const endpoints: Record<string, string> = {
    aptos: getEnv("APTOS_API_ENDPOINT"),
    aptos_testnet: getEnv("APTOS_TESTNET_API_ENDPOINT"),
  };

  if (currencyId in endpoints) {
    return endpoints[currencyId];
  }

  throw Error(`unexpected currency id format <${currencyId}>, should be like aptos[_testnet]`);
}
