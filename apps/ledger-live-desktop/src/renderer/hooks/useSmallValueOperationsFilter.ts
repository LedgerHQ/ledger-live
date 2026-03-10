import { useCallback } from "react";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import {
  clampSmallValueThresholdUsd,
  SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
} from "@ledgerhq/live-common/utils/smallValueOperationsThreshold";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/operation";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import {
  useFilterTokenOperationsThreshold,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";

function getAccountFamily(account: AccountLike): string {
  return account.type === "TokenAccount"
    ? account.token.parentCurrency.family
    : account.currency.family;
}

function isSelfTransferOperation(operation: Operation): boolean {
  return operation.senders.some(sender => operation.recipients.includes(sender));
}

export function useSmallValueOperationsFilter() {
  const [isSmallValueFilterEnabled] = useFilterTokenOperationsZeroAmount();
  const [smallValueThreshold] = useFilterTokenOperationsThreshold();
  const smallValueFeatureFlag = useFeature("lldHideSmallValueTokenOperations");
  const countervaluesState = useCountervaluesState();
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: isSmallValueFilterEnabled,
  });
  const isSmallValueFeatureEnabled = smallValueFeatureFlag?.enabled ?? false;

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      if (!isSmallValueFilterEnabled) return true;

      if (!isSmallValueFeatureEnabled) {
        return !isAddressPoisoningOperation(
          operation,
          account,
          addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
        );
      }

      if (account.type !== "TokenAccount") return true;

      const family = getAccountFamily(account);
      if (operation.type !== "IN" || !addressPoisoningFamilies?.includes(family)) {
        return true;
      }

      if (isSelfTransferOperation(operation)) {
        return true;
      }

      if (operation.value.isZero()) return false;

      const absValue = operation.value.abs();
      // Avoid precision loss when values exceed JS safe integer range.
      if (absValue.gt(Number.MAX_SAFE_INTEGER)) return true;
      const operationAmount = absValue.toNumber();
      if (!Number.isFinite(operationAmount)) return true;

      const currency = getAccountCurrency(account);
      const cvQuery = {
        from: currency,
        to: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
        value: operationAmount,
        disableRounding: true,
      };

      const operationCounterValue =
        calculate(countervaluesState, { ...cvQuery, date: operation.date }) ??
        calculate(countervaluesState, cvQuery);

      if (typeof operationCounterValue !== "number") return true;

      // calculate() returns values in the smallest fiat unit (e.g. cents for USD with magnitude=2)
      const usdMagnitude = SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.units[0].magnitude;
      const operationUsdValue = operationCounterValue / Math.pow(10, usdMagnitude);

      const thresholdUsd = clampSmallValueThresholdUsd(smallValueThreshold, 0);
      return operationUsdValue > thresholdUsd;
    },
    [
      countervaluesState,
      isSmallValueFeatureEnabled,
      isSmallValueFilterEnabled,
      smallValueThreshold,
      addressPoisoningFamilies,
    ],
  );

  return {
    filterOperations,
    isSmallValueFilterEnabled,
  };
}
