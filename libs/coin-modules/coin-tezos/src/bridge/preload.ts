import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { fetchAllBakers, hydrateBakers } from "../network/bakers";

export const getPreloadStrategy = (_currency: CryptoCurrency) => ({
  preloadMaxAge: 30 * 1000,
});

export const preload = async () => {
  const bakers = await fetchAllBakers();
  return { bakers };
};

export const hydrate = (data: any) => {
  if (!data || typeof data !== "object") return;
  const { bakers } = data;
  if (!bakers || typeof bakers !== "object" || !Array.isArray(bakers)) return;
  hydrateBakers(bakers);
};
