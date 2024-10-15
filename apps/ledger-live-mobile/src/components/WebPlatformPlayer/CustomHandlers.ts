import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { AccountLike } from "@ledgerhq/types-live";
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
            const tx = prepareSignTransaction(account, parentAccount, liveTx);

            navigation.navigate(NavigatorName.SignTransaction, {
              screen: ScreenName.SignTransactionSummary,
              params: {
                currentNavigation: ScreenName.SignTransactionSummary,
                nextNavigation: ScreenName.SignTransactionSelectDevice,
                transaction: tx,
                accountId: account.id,
                parentId: parentAccount ? parentAccount.id : undefined,
                appName: options?.hwAppId,
                dependencies: options?.dependencies,
                isACRE: true,
                onSuccess,
                onError,
              },
              onError,
            });
          },
        },
      }),
    };
  }, [accounts, tracking, manifest, navigation]);
}
