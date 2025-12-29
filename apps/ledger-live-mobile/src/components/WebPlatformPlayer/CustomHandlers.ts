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
import { useDispatch } from "~/context/store";
import { addOneAccount } from "~/actions/accounts";
import { setAccountName } from "@ledgerhq/live-wallet/lib/store";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import { Linking } from "react-native";

export function useACRECustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const dispatch = useDispatch();

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
              screen:
                message.standard === "EIP712"
                  ? ScreenName.SignSelectDevice
                  : ScreenName.SignSummary,
              params: {
                message,
                accountId: account.id,
                appName: options?.hwAppId,
                dependencies: options?.dependencies,
                onConfirmationHandler: onSuccess,
                onFailHandler: onError,
                isACRE: true,
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
          "custom.acre.registerAccount": ({
            parentAccount,
            accountName,
            existingAccounts: _existingAccounts,
            onSuccess,
            onError,
          }) => {
            try {
              dispatch(addOneAccount(parentAccount));
              dispatch(setAccountName(parentAccount.id, accountName));
              onSuccess();
            } catch (error) {
              onError(error as Error);
            }
          },
        },
      }),
    };
  }, [accounts, tracking, manifest, dispatch, navigation]);
}

export function useDeeplinkCustomHandlers() {
  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": params => {
            if (params) {
              Linking.openURL(params.url);
            }
          },
        },
      }),
    };
  }, []);
}
