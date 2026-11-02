import type { BigNumber } from "bignumber.js";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import {
  formatCurrencyUnit,
  type formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";
import type { AleoCoinConfig } from "@ledgerhq/live-common/families/aleo/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";

export const getAleoCurrencyConfig = (
  currency: CryptoCurrency | TokenCurrency,
): AleoCoinConfig | undefined =>
  getAleoCurrencyConfigById(
    currency.type === "CryptoCurrency" ? currency.id : currency.parentCurrencyId,
  );

export function formatAleoBalances({
  unit,
  balances,
  formatConfig,
}: {
  unit: Unit;
  formatConfig: formatCurrencyUnitOptions;
  balances: {
    spendableBalance: BigNumber;
    transparentBalance: BigNumber;
    privateBalance: BigNumber | null;
  };
}) {
  return {
    available: formatCurrencyUnit(unit, balances.spendableBalance, formatConfig),
    transparent: formatCurrencyUnit(unit, balances.transparentBalance, formatConfig),
    private: balances.privateBalance
      ? formatCurrencyUnit(unit, balances.privateBalance, formatConfig)
      : PRIVATE_BALANCE_PLACEHOLDER,
  };
}
