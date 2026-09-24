import coinConfig from "../config";

export * from "./IconGenerator";

const APTOS_CURRENCY_IDS = ["aptos", "aptos_testnet"];

export function endpointByCurrencyId(currencyId: string): string {
  if (APTOS_CURRENCY_IDS.includes(currencyId)) {
    return coinConfig.getCoinConfig(currencyId).infra.APTOS_API_ENDPOINT;
  }

  throw Error(`unexpected currency id format <${currencyId}>, should be like aptos[_testnet]`);
}
