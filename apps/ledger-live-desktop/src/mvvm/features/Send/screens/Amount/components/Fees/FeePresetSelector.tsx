import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useFeePresetOptions } from "../../hooks/useFeePresetOptions";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { cn } from "LLD/utils/cn";

type FeePresetSelectorProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  selectedStrategy?: string | null;
  onSelectStrategy: (strategy: string) => void;
}>;

export function FeePresetSelector({
  account,
  parentAccount,
  transaction,
  selectedStrategy,
  onSelectStrategy,
}: FeePresetSelectorProps) {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const options = useFeePresetOptions(accountCurrency, transaction);
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const convertCountervalue = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const accountUnit = mainAccount.currency.units[mainAccount.currency.units.length - 1];
  const fiatUnit = counterValueCurrency.units[0];

  if (!options.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
      {options.map(option => {
        const labelKey = `fees.${option.id}`;
        const label = option.id && t(labelKey) !== labelKey ? t(labelKey) : option.id.toUpperCase();
        const amountLabel = formatCurrencyUnit(accountUnit, option.amount, {
          showCode: true,
          disableRounding: true,
        });
        const countervalue = convertCountervalue(mainAccount.currency, option.amount);
        const countervalueLabel =
          countervalue !== null && countervalue !== undefined
            ? formatCurrencyUnit(fiatUnit, countervalue, {
                showCode: true,
                disableRounding: true,
              })
            : null;
        const timingLabel =
          option.estimatedMs !== undefined
            ? `≈ ${Math.max(1, Math.round(option.estimatedMs / 1000))} ${t("time.second_short")}`
            : null;

        return (
          <button
            key={option.id}
            type="button"
            disabled={option.disabled}
            onClick={() => onSelectStrategy(option.id)}
            className={cn(
              "flex flex-col gap-8 rounded-lg border p-16 text-left transition-colors",
              selectedStrategy === option.id ? "border-active bg-active-subtle" : "border-muted",
              option.disabled ? "opacity-40" : "hover:bg-muted-hover",
            )}
          >
            <span className="uppercase tracking-wide text-muted body-3-semi-bold">{label}</span>
            <span className="text-base body-1-semi-bold">{amountLabel}</span>
            {countervalueLabel ? (
              <span className="text-muted body-3">{countervalueLabel}</span>
            ) : null}
            {timingLabel ? <span className="text-muted body-4">{timingLabel}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
