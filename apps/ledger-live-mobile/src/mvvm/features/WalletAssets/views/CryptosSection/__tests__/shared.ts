import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Asset } from "~/types/asset";

export const bitcoin = getCryptoCurrencyById("bitcoin");
export const ethereum = getCryptoCurrencyById("ethereum");

export const createCryptoAsset = (
  currency: ReturnType<typeof getCryptoCurrencyById>,
  amount: number,
): Asset => ({
  currency,
  accounts: [],
  amount,
});
