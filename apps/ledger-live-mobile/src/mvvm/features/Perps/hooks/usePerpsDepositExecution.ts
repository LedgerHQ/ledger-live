import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import {
  usePerpsDepositExecution as useSharedPerpsDepositExecution,
  type PerpsDepositExecution,
  type PerpsDepositExecutionCallbacks,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution";
import { useDispatch, useSelector } from "~/context/hooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { mevProtectionSelector } from "~/reducers/settings";
import {
  useCompleteExchangeDeviceAction,
  useStartExchangeDeviceAction,
  useTransactionDeviceAction,
} from "~/hooks/deviceActions";
import { broadcastLogger } from "~/datadog";

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

  const start = useStartExchangeDeviceAction();
  const confirm = useCompleteExchangeDeviceAction();
  const sign = useTransactionDeviceAction();
  const deviceActions = useMemo(() => ({ start, confirm, sign }), [start, confirm, sign]);

  const updateAccount = useCallback(
    (accountId: string, updater: (account: Account) => Account) =>
      dispatch(updateAccountWithUpdater({ accountId, updater })),
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
