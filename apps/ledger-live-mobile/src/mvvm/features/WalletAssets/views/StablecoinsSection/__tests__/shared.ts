import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Asset } from "~/types/asset";

export const bitcoin = getCryptoCurrencyById("bitcoin");
export const ethereum = getCryptoCurrencyById("ethereum");

export const createAsset = (
  currency: ReturnType<typeof getCryptoCurrencyById>,
  amount: number,
): Asset => ({
  currency,
  accounts: [],
  amount,
});
