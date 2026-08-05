import type { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getAccountCurrency } from "../../account";
import { findCryptoCurrencyById, formatCurrencyUnit, parseCurrencyUnit } from "../../currencies";
import type { PerpsDepositAmount } from "./server";

export async function resolvePerpsDepositAmountCurrency(
  amount: PerpsDepositAmount,
  account: AccountLike,
): Promise<CryptoOrTokenCurrency> {
  const accountCurrency = getAccountCurrency(account);
  if (accountCurrency.id === amount.currencyId) {
    return accountCurrency;
  }

  const cryptoCurrency = findCryptoCurrencyById(amount.currencyId);
  if (cryptoCurrency) {
    return cryptoCurrency;
  }

  const token = await getCryptoAssetsStore().findTokenById(amount.currencyId);
  if (token) {
    return token;
  }

  return accountCurrency;
}

export async function formatPerpsDepositAmount(
  amount: PerpsDepositAmount,
  account: AccountLike,
): Promise<string> {
  if (!amount.value) {
    return "";
  }

  const currency = await resolvePerpsDepositAmountCurrency(amount, account);
  const unit = currency.units[0];
  const atomicValue = parseCurrencyUnit(unit, amount.value);

  return formatCurrencyUnit(unit, atomicValue, {
    showCode: true,
    disableRounding: true,
  });
}
