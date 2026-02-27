import { useCallback } from "react";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import {
  useFilterTokenOperationsThreshold,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

function getAccountFamily(account: AccountLike): string {
  return account.type === "TokenAccount"
    ? account.token.parentCurrency.family
    : account.currency.family;
}

export function useSmallValueOperationsFilter(showHiddenSmallValueOperations = false) {
  const [isSmallValueFilterEnabled] = useFilterTokenOperationsZeroAmount();
  const [smallValueThreshold] = useFilterTokenOperationsThreshold();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const countervaluesState = useCountervaluesState();
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: isSmallValueFilterEnabled,
  });

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      if (showHiddenSmallValueOperations || !isSmallValueFilterEnabled) return true;
      if (account.type !== "TokenAccount") return true;

      const family = getAccountFamily(account);
      if (operation.type !== "IN" || !addressPoisoningFamilies?.includes(family)) {
        return true;
      }

      if (operation.value.isZero()) return false;

      const operationAmount = operation.value.abs().toNumber();
      if (!Number.isFinite(operationAmount)) return true;

      const currency = getAccountCurrency(account);
      const cvQuery = {
        from: currency,
        to: counterValueCurrency,
        value: operationAmount,
        disableRounding: true,
      };

      const operationCounterValue =
        calculate(countervaluesState, { ...cvQuery, date: operation.date }) ??
        calculate(countervaluesState, cvQuery);

      if (typeof operationCounterValue !== "number") return true;

      // calculate() returns values in the smallest fiat unit (e.g. cents for USD with magnitude=2)
      const fiatMagnitude = counterValueCurrency.units[0].magnitude;
      const operationFiatValue = operationCounterValue / Math.pow(10, fiatMagnitude);

      const threshold = Number.isFinite(smallValueThreshold) ? Math.max(0, smallValueThreshold) : 0;
      return operationFiatValue >= threshold;
    },
    [
      counterValueCurrency,
      countervaluesState,
      isSmallValueFilterEnabled,
      showHiddenSmallValueOperations,
      smallValueThreshold,
      addressPoisoningFamilies,
    ],
  );

  return {
    filterOperations,
    isSmallValueFilterEnabled,
  };
}
