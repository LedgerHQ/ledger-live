import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import logger from "~/renderer/logger";
export function clearBridgeCache() {
  Object.keys(global.localStorage)
    .filter(k => k.startsWith("bridgeproxypreload"))
    .forEach(k => {
      global.localStorage.removeItem(k);
    });
}
function currencyCacheId(currency) {
  return `bridgeproxypreload_${currency.id}`;
}
export function listCachedCurrencyIds() {
  return Object.keys(global.localStorage)
    .filter(k => k.startsWith("bridgeproxypreload"))
    .map(k => k.replace("bridgeproxypreload_", ""));
}
export function setCurrencyCache(currency: CryptoCurrency, data: unknown) {
  if (data) {
    const serialized = JSON.stringify(data);
    global.localStorage.setItem(currencyCacheId(currency), serialized);
  }
}
export function getCurrencyCache(currency: CryptoCurrency): unknown {
  const res = global.localStorage.getItem(currencyCacheId(currency));
  if (res && res !== "undefined") {
    try {
      return JSON.parse(res);
    } catch (e) {
      log("bridge/cache", `failure to retrieve cache ${String(e)}`);
      logger.error(e);
    }
  }
  return undefined;
}
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    setCurrencyCache(c, d);
    return Promise.resolve();
  },
  getData(c) {
    return Promise.resolve(getCurrencyCache(c));
  },
});
export const hydrateCurrency = cache.hydrateCurrency;
export const prepareCurrency = cache.prepareCurrency;
