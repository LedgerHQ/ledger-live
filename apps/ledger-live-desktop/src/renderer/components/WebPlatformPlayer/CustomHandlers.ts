import { useMemo } from "react";
import { ipcRenderer } from "electron";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { AccountLike } from "@ledgerhq/types-live";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as acreHandlers } from "@ledgerhq/live-common/wallet-api/ACRE/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/ACRE/tracking";
import { track } from "~/renderer/analytics/segment";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { replaceAccounts, updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { WebviewProps } from "../Web3AppWebview/types";
import { setAccountName } from "@ledgerhq/live-wallet/store";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";

export function useACRECustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  const { pushToast } = useToasts();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const tracking = useMemo(
    () =>
      trackingWrapper(
        (
          eventName: string,
          properties?: Record<string, unknown> | null,
          mandatory?: boolean | null,
        ) =>
          track(
            eventName,
            {
              ...properties,
              flowInitiatedFrom:
                currentRouteNameRef.current === "Platform Catalog"
                  ? "Discover"
                  : currentRouteNameRef.current,
            },
            mandatory,
          ),
      ),
    [],
  );

  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...acreHandlers({
        accounts,
        tracking,
        manifest,
        uiHooks: {
          "custom.acre.messageSign": ({
            account,
            message,
            options,
            onSuccess,
            onError,
            onCancel,
          }) => {
            ipcRenderer.send("show-app", {});
            dispatch(
              openModal("MODAL_SIGN_MESSAGE", {
                isACRE: true,
                account,
                message,
                useApp: options?.hwAppId,
                dependencies: options?.dependencies,
                onConfirmationHandler: onSuccess,
                onFailHandler: onError,
                onClose: onCancel,
              }),
            );
          },
          "custom.acre.transactionSign": ({
            account,
            parentAccount,
            signFlowInfos: { canEditFees, hasFeesProvided, liveTx },
            options,
            onSuccess,
            onError,
          }) => {
            ipcRenderer.send("show-app", {});
            dispatch(
              openModal("MODAL_SIGN_TRANSACTION", {
                isACRE: true,
                canEditFees,
                stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
                transactionData: liveTx,
                useApp: options?.hwAppId,
                dependencies: options?.dependencies,
                account,
                parentAccount,
                onResult: onSuccess,
                onCancel: onError,
                manifestId: manifest.id,
                manifestName: manifest.name,
              }),
            );
          },
          "custom.acre.transactionBroadcast": (
            account,
            parentAccount,
            mainAccount,
            optimisticOperation,
          ) => {
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
                tracking.broadcastOperationDetailsClick(manifest);
                setDrawer(OperationDetails, {
                  operationId: optimisticOperation.id,
                  accountId: account.id,
                  parentId: parentAccount?.id as string | undefined | null,
                });
              },
            });
          },
          "custom.acre.registerAccount": ({
            parentAccount,
            accountName,
            existingAccounts,
            onSuccess,
            onError,
          }) => {
            try {
              // Desktop: add account via replaceAccounts so the db middleware persists to storage
              dispatch(replaceAccounts([parentAccount, ...existingAccounts]));
              dispatch(setAccountName(parentAccount.id, accountName));
              onSuccess();
            } catch (error) {
              onError(error as Error);
            }
          },
        },
      }),
    };
  }, [accounts, tracking, manifest, dispatch, pushToast, t]);
}

export function useDeeplinkCustomHandlers() {
  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": params => {
            if (params) {
              ipcRenderer.send("deep-linking", params.url);
            }
          },
        },
      }),
    };
  }, []);
}
