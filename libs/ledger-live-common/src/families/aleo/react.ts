import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../../hw/connectApp";
import connectApp from "../../hw/connectApp";
import type { Device } from "../../hw/actions/types";
import {
  createAction,
  getViewKeyExec,
  type Request,
  type ViewKeyProgress,
  type ViewKeysByAccountId,
} from "./hw/getViewKey/index";
import { patchAccountWithViewKey } from "./utils";

type ConnectAppExec = (input: ConnectAppInput) => Observable<ConnectAppEvent>;
type GetViewKeyExec = (transport: Transport, request: Request) => Observable<ViewKeyProgress>;

export interface UseAleoViewKeyApprovalParams {
  device: Device | null | undefined;
  selectedAccounts: Account[];
  currency: CryptoCurrency;
  connectAppExec?: ConnectAppExec;
  getViewKeyOverride?: GetViewKeyExec;
}

/**
 * Encapsulates the view-key approval device action for the Aleo add-account
 * flow. Shared by both Desktop and Mobile; platform-specific concerns (navigation,
 * Redux dispatch) are handled by the caller.
 *
 * Callers must ensure that `connectAppExec` and `getViewKeyOverride` (if provided)
 * are stable references so the internal action is not recreated on every render.
 */
export function useAleoViewKeyApproval({
  device,
  selectedAccounts,
  currency,
  connectAppExec,
  getViewKeyOverride,
}: UseAleoViewKeyApprovalParams) {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;

  const action = useMemo(
    () =>
      createAction(
        connectAppExec ?? connectApp({ isLdmkConnectAppEnabled }),
        getViewKeyOverride ?? getViewKeyExec,
      ),
    [isLdmkConnectAppEnabled, connectAppExec, getViewKeyOverride],
  );

  const request = useMemo<Request>(
    () => ({ appName: "Aleo", selectedAccounts, currency }),
    [selectedAccounts, currency],
  );

  const hookState = action.useHook(device, request);
  const payload = action.mapResult(hookState);

  const { confirmedAccountIds, rejectedAccountIds } = useMemo(() => {
    const confirmed = new Set<string>();
    const rejected = new Set<string>();
    Object.entries(hookState.shareProgress.viewKeys).forEach(([accountId, viewKey]) => {
      (viewKey != null ? confirmed : rejected).add(accountId);
    });
    return { confirmedAccountIds: confirmed, rejectedAccountIds: rejected };
  }, [hookState.shareProgress.viewKeys]);

  return { hookState, payload, request, confirmedAccountIds, rejectedAccountIds };
}

export function buildAccountsWithViewKeys(
  accounts: Account[],
  viewKeysByAccountId: ViewKeysByAccountId,
): Account[] {
  return accounts.reduce<Account[]>((acc, account) => {
    const viewKey = viewKeysByAccountId?.[account.id];
    if (!viewKey) return acc;
    acc.push(patchAccountWithViewKey(account, viewKey));
    return acc;
  }, []);
}
