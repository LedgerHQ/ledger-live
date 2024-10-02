import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as acreHandlers } from "@ledgerhq/live-common/wallet-api/ACRE/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/ACRE/tracking";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { WebviewProps } from "../Web3AppWebview/types";
import prepareSignTransaction from "../Web3AppWebview/liveSDKLogic";

export function useACRECustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const tracking = useMemo(
    () =>
      trackingWrapper((eventName: string, properties?: Record<string, unknown> | null) =>
        track(eventName, {
          ...properties,
          flowInitiatedFrom:
            currentRouteNameRef.current === "Platform Catalog"
              ? "Discover"
              : currentRouteNameRef.current,
        }),
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
            navigation.navigate(NavigatorName.SignMessage, {
              screen: ScreenName.SignSummary,
              params: {
                message,
                accountId: account.id,
                appName: options?.hwAppId,
                dependencies: options?.dependencies,
                onConfirmationHandler: onSuccess,
                onFailHandler: onError,
              },
              onClose: onCancel,
            });
          },
          "custom.acre.transactionSign": ({
            account,
            parentAccount,
            signFlowInfos: { liveTx },
            options,
            onSuccess,
            onError,
          }) => {
            const tx = prepareSignTransaction(account, parentAccount, liveTx, true);

            navigation.navigate(NavigatorName.SignTransaction, {
              screen: ScreenName.SignTransactionSummary,
              params: {
                currentNavigation: ScreenName.SignTransactionSummary,
                nextNavigation: ScreenName.SignTransactionSelectDevice,
                transaction: tx as Transaction,
                accountId: account.id,
                parentId: parentAccount ? parentAccount.id : undefined,
                appName: options?.hwAppId,
                dependencies: options?.dependencies,
                isACRE: true,
                onSuccess: ({
                  signedOperation,
                  transactionSignError,
                }: {
                  signedOperation: SignedOperation;
                  transactionSignError: Error;
                }) => {
                  if (transactionSignError) {
                    onError(transactionSignError);
                  } else {
                    onSuccess(signedOperation);

                    const n =
                      navigation.getParent<
                        StackNavigatorNavigation<BaseNavigatorStackParamList>
                      >() || navigation;
                    n.pop();
                  }
                },
                onError,
              },
            });
          },
        },
      }),
    };
  }, [accounts, tracking, manifest, navigation]);
}
