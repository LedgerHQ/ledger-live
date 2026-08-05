import type { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  findCryptoCurrencyById,
  formatCurrencyUnit,
  parseCurrencyUnit,
} from "@ledgerhq/live-common/currencies/index";
import type { PerpsDepositAmount } from "@ledgerhq/live-common/wallet-api/Perps/server";

function resolveCurrency(amount: PerpsDepositAmount, account: AccountLike): CryptoOrTokenCurrency {
  const accountCurrency = getAccountCurrency(account);
  if (accountCurrency.id === amount.currencyId) {
    return accountCurrency;
  }

  return findCryptoCurrencyById(amount.currencyId) ?? accountCurrency;
}

/** Renders a deposit amount, given as a plain decimal string, in its own currency. */
export function formatDepositAmount(amount: PerpsDepositAmount, account: AccountLike): string {
  if (!amount.value) {
    return "";
  }

  const unit = resolveCurrency(amount, account).units[0];

  return formatCurrencyUnit(unit, parseCurrencyUnit(unit, amount.value), {
    showCode: true,
    disableRounding: true,
  });
}
