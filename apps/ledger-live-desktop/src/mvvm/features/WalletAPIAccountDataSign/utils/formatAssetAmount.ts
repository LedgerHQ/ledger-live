import { BigNumber } from "bignumber.js";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";

/** A native coin amount with its unit; another asset keeps its smallest unit and id. */
export function formatAssetAmount(amount: string, assetId: string): string {
  const currency = findCryptoCurrencyById(assetId);
  if (!currency) return `${amount} ${assetId}`;
  return formatCurrencyUnit(currency.units[0], new BigNumber(amount), {
    showCode: true,
    disableRounding: true,
  });
}
