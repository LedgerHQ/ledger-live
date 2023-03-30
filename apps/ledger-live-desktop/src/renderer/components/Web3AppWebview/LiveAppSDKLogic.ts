import { Dispatch } from "redux";
import { TFunction } from "react-i18next";

import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getEnv } from "@ledgerhq/live-common/env";
import { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { accountToPlatformAccount } from "@ledgerhq/live-common/platform/converters";
import { broadcastTransactionLogic as broadcastTransactionCommonLogic } from "@ledgerhq/live-common/platform/logic";
import { RawPlatformSignedTransaction } from "@ledgerhq/live-common/platform/rawTypes";
import { serializePlatformAccount } from "@ledgerhq/live-common/platform/serializers";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { updateAccountWithUpdater } from "../../actions/accounts";
import { selectAccountAndCurrency } from "../../drawers/DataSelector/logic";

import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";

const tracking = trackingWrapper(track);

type WebPlatformContext = {
  manifest: LiveAppManifest;
  dispatch: Dispatch;
  accounts: AccountLike[];
};

export type RequestAccountParams = {
  currencies?: string[];
  allowAddAccount?: boolean;
  includeTokens?: boolean;
};
export const requestAccountLogic = async (
  { manifest }: Omit<WebPlatformContext, "accounts" | "dispatch">,
  { currencies, includeTokens }: RequestAccountParams,
) => {
  tracking.platformRequestAccountRequested(manifest);

  /**
   * make sure currencies are strings
   * PS: yes `currencies` is properly typed as `string[]` but this typing only
   * works at build time and the `currencies` array is received at runtime from
   * JSONRPC requests. So we need to make sure the array is properly typed.
   */
  const safeCurrencies = currencies?.filter(c => typeof c === "string") ?? undefined;

  const { account, parentAccount } = await selectAccountAndCurrency(safeCurrencies, includeTokens);

  return serializePlatformAccount(accountToPlatformAccount(account, parentAccount));
};

export const broadcastTransactionLogic = (
  { manifest, dispatch, accounts }: WebPlatformContext,
  accountId: string,
  signedTransaction: RawPlatformSignedTransaction,
  pushToast: (data: ToastData) => void,
  t: TFunction,
): Promise<string> =>
  broadcastTransactionCommonLogic(
    { manifest, accounts, tracking },
    accountId,
    signedTransaction,
    async (
      account: AccountLike,
      parentAccount: Account | null,
      signedOperation: SignedOperation,
    ): Promise<string> => {
      const bridge = getAccountBridge(account, parentAccount);
      const mainAccount = getMainAccount(account, parentAccount);

      let optimisticOperation: Operation = signedOperation.operation;

      // FIXME: couldn't we use `useBroadcast` here?
      if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        try {
          optimisticOperation = await bridge.broadcast({
            account: mainAccount,
            signedOperation,
          });
          tracking.platformBroadcastSuccess(manifest);
        } catch (error) {
          tracking.platformBroadcastFail(manifest);
          throw error;
        }
      }

      dispatch(
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(account, optimisticOperation),
        ),
      );

      pushToast({
        id: optimisticOperation.id,
        type: "operation",
        title: t("platform.flows.broadcast.toast.title"),
        text: t("platform.flows.broadcast.toast.text"),
        icon: "info",
        callback: () => {
          tracking.platformBroadcastOperationDetailsClick(manifest);
          setDrawer(OperationDetails, {
            operationId: optimisticOperation.id,
            accountId: account.id,
            parentId: parentAccount?.id,
          });
        },
      });

      return optimisticOperation.hash;
    },
  );
