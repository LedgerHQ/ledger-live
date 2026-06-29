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

interface UseAleoViewKeyApprovalParams {
  device: Device | null | undefined;
  selectedAccounts: Account[];
  currency: CryptoCurrency;
  connectAppExec?: ConnectAppExec;
  viewKeyExec?: GetViewKeyExec;
}

export function useAleoViewKeyApproval({
  device,
  selectedAccounts,
  currency,
  connectAppExec,
  viewKeyExec,
}: UseAleoViewKeyApprovalParams) {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;

  const action = useMemo(
    () =>
      createAction(
        connectAppExec ?? connectApp({ isLdmkConnectAppEnabled }),
        viewKeyExec ?? getViewKeyExec,
      ),
    [isLdmkConnectAppEnabled, connectAppExec, viewKeyExec],
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
      if (viewKey === null) {
        rejected.add(accountId);
      } else {
        confirmed.add(accountId);
      }
    });
    return { confirmedAccountIds: confirmed, rejectedAccountIds: rejected };
  }, [hookState.shareProgress.viewKeys]);

  return { hookState, payload, request, confirmedAccountIds, rejectedAccountIds };
}

export function buildAccountsWithViewKeys(
  accounts: Account[],
  viewKeysByAccountId: NonNullable<ViewKeysByAccountId>,
): Account[] {
  return accounts.reduce<Account[]>((acc, account) => {
    const viewKey = viewKeysByAccountId[account.id];
    if (!viewKey) return acc;
    acc.push(patchAccountWithViewKey(account, viewKey));
    return acc;
  }, []);
}
