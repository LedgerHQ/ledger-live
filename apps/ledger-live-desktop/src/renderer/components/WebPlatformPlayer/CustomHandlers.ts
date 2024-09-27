import { useMemo } from "react";
import { ipcRenderer } from "electron";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
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
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { WebviewProps } from "../Web3AppWebview/types";

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
          "custom.acre.messageSign": ({ account, message, onSuccess, onError, onCancel }) => {
            ipcRenderer.send("show-app", {});
            dispatch(
              openModal("MODAL_SIGN_MESSAGE", {
                account,
                message,
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
        },
      }),
    };
  }, [accounts, tracking, manifest, dispatch, pushToast, t]);
}
