import { Dispatch } from "redux";
import { TFunction } from "i18next";
import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getEnv } from "@ledgerhq/live-env";
import { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { accountToPlatformAccount } from "@ledgerhq/live-common/platform/converters";
import { broadcastTransactionLogic as broadcastTransactionCommonLogic } from "@ledgerhq/live-common/platform/logic";
import { RawPlatformSignedTransaction } from "@ledgerhq/live-common/platform/rawTypes";
import { serializePlatformAccount } from "@ledgerhq/live-common/platform/serializers";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { listSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/support";
import { isPlatformSupportedCurrency } from "@ledgerhq/live-common/platform/helpers";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { selectAccountAndCurrency } from "../../drawers/DataSelector/logic";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { openAssetAndAccountDrawerPromise } from "LLD/features/ModularDrawer";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

const trackingLiveAppSDKLogic = trackingWrapper(track);

type WebPlatformContext = {
  manifest: LiveAppManifest;
  dispatch: Dispatch;
  accounts: AccountLike[];
  tracking: typeof trackingLiveAppSDKLogic;
  mevProtected: boolean;
};

export type RequestAccountParams = {
  currencies?: string[];
  allowAddAccount?: boolean;
  includeTokens?: boolean;
  areCurrenciesFiltered?: boolean;
};
export const requestAccountLogic = async (
  walletState: WalletState,
  { manifest }: Omit<WebPlatformContext, "accounts" | "dispatch" | "tracking" | "mevProtected">,
  { currencies, includeTokens }: RequestAccountParams,
  deactivatedCurrencyIds: Set<string>,
  modularDrawerVisible?: boolean,
) => {
  trackingLiveAppSDKLogic.platformRequestAccountRequested(manifest);

  /**
   * make sure currencies are strings
   * PS: yes `currencies` is properly typed as `string[]` but this typing only
   * works at build time and the `currencies` array is received at runtime from
   * JSONRPC requests. So we need to make sure the array is properly typed.
   */
  const safeCurrencies = currencies?.filter(c => typeof c === "string") ?? undefined;
  const currencyIds =
    !includeTokens && !safeCurrencies
      ? listSupportedCurrencies().reduce<string[]>((acc, currency) => {
          if (isPlatformSupportedCurrency(currency) && !deactivatedCurrencyIds.has(currency.id))
            acc.push(currency.id);
          return acc;
        }, [])
      : safeCurrencies;

  const source =
    currentRouteNameRef.current === "Platform Catalog"
      ? "Discover"
      : currentRouteNameRef.current ?? "Unknown";

  const flow = manifest.name;

  const { account, parentAccount } = modularDrawerVisible
    ? await openAssetAndAccountDrawerPromise({
        currencies: currencyIds,
        areCurrenciesFiltered: currencyIds && currencyIds.length > 0,
      })
    : await selectAccountAndCurrency(currencyIds, flow, source);

  return serializePlatformAccount(accountToPlatformAccount(walletState, account, parentAccount));
};

export const broadcastTransactionLogic = (
  { manifest, dispatch, accounts, tracking, mevProtected }: WebPlatformContext,
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
      parentAccount: Account | undefined,
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
            broadcastConfig: { mevProtected },
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
