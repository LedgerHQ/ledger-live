import storage from "LLM/storage";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function clearBridgeCache() {
  const keys = await storage.keys();
  await storage.delete(keys.filter(k => k.startsWith("bridgeproxypreload")));
}

function currencyCacheId(currency: CryptoCurrency) {
  return `bridgeproxypreload_${currency.id}`;
}

export async function listCachedCurrencyIds() {
  const keys = await storage.keys();
  return keys
    .filter(k => k.startsWith("bridgeproxypreload"))
    .map(k => k.replace("bridgeproxypreload_", ""));
}

export async function setCurrencyCache(currency: CryptoCurrency, data: unknown) {
  if (data) {
    await storage.save(currencyCacheId(currency), data);
  }
}

export async function getCurrencyCache(currency: CryptoCurrency): Promise<unknown> {
  try {
    const res = await storage.get(currencyCacheId(currency));
    return res;
  } catch (e) {
    log("bridge/cache", `failure to retrieve cache ${String(e)}`);
  }
  return undefined;
}

export const bridgeCache = makeBridgeCacheSystem({
  saveData: setCurrencyCache,
  getData: getCurrencyCache,
});
export const hydrateCurrency = bridgeCache.hydrateCurrency;
export const prepareCurrency = bridgeCache.prepareCurrency;
