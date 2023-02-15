import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function clearBridgeCache() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(
    keys.filter(k => k.startsWith("bridgeproxypreload")),
  );
}

function currencyCacheId(currency: CryptoCurrency) {
  return `bridgeproxypreload_${currency.id}`;
}

export async function listCachedCurrencyIds() {
  const keys = await AsyncStorage.getAllKeys();
  return keys
    .filter(k => k.startsWith("bridgeproxypreload"))
    .map(k => k.replace("bridgeproxypreload_", ""));
}

export async function setCurrencyCache(
  currency: CryptoCurrency,
  data: unknown,
) {
  if (data) {
    const serialized = JSON.stringify(data);

    if (serialized) {
      await AsyncStorage.setItem(currencyCacheId(currency), serialized);
    }
  }
}
export async function getCurrencyCache(
  currency: CryptoCurrency,
): Promise<unknown> {
  const res = await AsyncStorage.getItem(currencyCacheId(currency));

  if (res) {
    try {
      return JSON.parse(res);
    } catch (e) {
      log("bridge/cache", `failure to retrieve cache ${String(e)}`);
    }
  }

  return undefined;
}
export const bridgeCache = makeBridgeCacheSystem({
  saveData: setCurrencyCache,
  getData: getCurrencyCache,
});
export const hydrateCurrency = bridgeCache.hydrateCurrency;
export const prepareCurrency = bridgeCache.prepareCurrency;
