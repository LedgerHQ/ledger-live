import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import { createAction as createCompleteExchangeAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  usePerpsDepositExecution as useSharedPerpsDepositExecution,
  type PerpsDepositExecution,
  type PerpsDepositExecutionCallbacks,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { useStartExchangeAction, useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { broadcastLogger } from "~/datadog/logs";

export type {
  PerpsDepositDeviceStep,
  PerpsDepositExecutionCallbacks,
  PerpsDepositOutcome,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution";

export function usePerpsDepositExecution(
  params: PerpsDepositReviewParams,
  callbacks: PerpsDepositExecutionCallbacks,
): PerpsDepositExecution {
  const dispatch = useDispatch();
  const accounts = useSelector(flattenAccountsSelector);
  const mevProtected = useSelector(mevProtectionSelector);

  const start = useStartExchangeAction();
  const sign = useTransactionAction();
  const confirm = useMemo(() => createCompleteExchangeAction(completeExchange), []);
  const deviceActions = useMemo(() => ({ start, confirm, sign }), [start, confirm, sign]);

  const updateAccount = useCallback(
    (accountId: string, updater: (account: Account) => Account) =>
      dispatch(updateAccountWithUpdater(accountId, updater)),
    [dispatch],
  );

  return useSharedPerpsDepositExecution(params, callbacks, {
    accounts,
    mevProtected,
    deviceActions,
    updateAccount,
    broadcastLogger,
    track,
  });
}
