import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";

type UseFeeInfoParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  status: TransactionStatus;
  feeCurrencyAccountId?: string | null;
}>;

export function useFeeInfo({
  account,
  parentAccount,
  status,
  feeCurrencyAccountId,
}: UseFeeInfoParams) {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const fiatUnit = counterValueCurrency.units[0];

  const feeCurrencySubAccount = useMemo(() => {
    if (!feeCurrencyAccountId) return null;
    return (
      ((mainAccount.subAccounts ?? []).find(
        sub => sub.id === feeCurrencyAccountId && sub.type === "TokenAccount",
      ) as TokenAccount | undefined) ?? null
    );
  }, [feeCurrencyAccountId, mainAccount.subAccounts]);

  const displayUnit = feeCurrencySubAccount?.token.units[0] ?? accountUnit;
  const displayCurrency = feeCurrencySubAccount?.token ?? accountCurrency;

  const estimatedFees = useMemo(
    () => status.estimatedFees ?? new BigNumber(0),
    [status.estimatedFees],
  );
  const estimatedFeesCountervalue = useCalculate({
    from: displayCurrency,
    to: counterValueCurrency,
    value: estimatedFees.toNumber(),
    disableRounding: true,
  });
  const estimatedFeesFiat = useMemo(
    () => new BigNumber(estimatedFeesCountervalue ?? 0),
    [estimatedFeesCountervalue],
  );

  const feeSummary = useMemo(
    () =>
      estimatedFees.gt(0) || estimatedFeesFiat.gt(0)
        ? {
            fiatLabel: t("newSendFlow.networkFeesInFiat", {
              currency: counterValueCurrency.ticker,
            }),
            fiatValue: formatCurrencyUnit(fiatUnit, estimatedFeesFiat, {
              showCode: true,
              disableRounding: true,
              locale,
            }),
            cryptoLabel: t("newSendFlow.feesAmount", {
              unit: displayUnit.code,
            }),
            cryptoValue: formatCurrencyUnit(displayUnit, estimatedFees, {
              showCode: true,
              disableRounding: true,
              locale,
            }),
            description: t("newSendFlow.feesPaid"),
          }
        : null,
    [
      displayUnit,
      counterValueCurrency.ticker,
      estimatedFees,
      estimatedFeesFiat,
      fiatUnit,
      locale,
      t,
    ],
  );

  return { feeSummary };
}
