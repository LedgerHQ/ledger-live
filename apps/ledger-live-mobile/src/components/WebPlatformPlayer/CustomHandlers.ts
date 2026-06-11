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
import { useDispatch, useSelector } from "~/context/hooks";
import { addOneAccount } from "~/actions/accounts";
import { setAccountName } from "@ledgerhq/live-wallet/store";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import { isUrlSafe } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/isUrlSafe";
import { handlers as liveAppModalHandlers } from "@ledgerhq/live-common/wallet-api/LiveAppModal/server";
import { resolveLiveAppModalParams } from "@ledgerhq/live-common/wallet-api/LiveAppModal/types";
import { setLiveAppModal } from "~/reducers/liveAppModal";
import { Linking } from "react-native";
import { useFeature } from "@features/platform-feature-flags";
import { isLockedSelector } from "~/reducers/auth";

type DeeplinkOpenHandlerParams = { url: string };

type CreateDeeplinkOpenHandlerParams = {
  isDeeplinkOpenHardeningEnabled: boolean;
  isLocked: boolean;
  openURL?: (url: string) => void | Promise<unknown>;
};

export function createDeeplinkOpenHandler({
  isDeeplinkOpenHardeningEnabled,
  isLocked,
  openURL = url => Linking.openURL(url),
}: CreateDeeplinkOpenHandlerParams) {
  return (params?: DeeplinkOpenHandlerParams) => {
    if (!params) {
      return;
    }

    if (isDeeplinkOpenHardeningEnabled && !isUrlSafe(params.url)) {
      console.warn("Blocked unsafe custom.deeplink.open URL");
      track("custom.deeplink.open blocked", { reason: "scheme" });
      return;
    }

    if (isDeeplinkOpenHardeningEnabled && isLocked) {
      console.warn("Blocked custom.deeplink.open while app is locked");
      track("custom.deeplink.open blocked", { reason: "locked" });
      return;
    }

    openURL(params.url);
  };
}

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
          "custom.acre.transactionSign": async ({
            account,
            parentAccount,
            signFlowInfos: { liveTx },
            options,
            onSuccess,
            onError,
          }) => {
            try {
              const tx = await prepareSignTransaction(account, parentAccount, liveTx);
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
            } catch (err) {
              onError(err as Error);
            }
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
  const isDeeplinkOpenHardeningEnabled = useFeature("lwmDeeplinkOpenHardening")?.enabled === true;
  const isLocked = useSelector(isLockedSelector);

  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": createDeeplinkOpenHandler({
            isDeeplinkOpenHardeningEnabled,
            isLocked,
          }),
        },
      }),
    };
  }, [isDeeplinkOpenHardeningEnabled, isLocked]);
}

export function useLiveAppModalCustomHandlers(manifest: WebviewProps["manifest"]) {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const dispatch = useDispatch();
  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...liveAppModalHandlers({
        uiHooks: {
          "custom.liveApp.modal.open": input => {
            dispatch(setLiveAppModal(resolveLiveAppModalParams(input, manifest.id)));
            navigation.navigate(ScreenName.LiveAppModal);
          },
        },
      }),
    };
  }, [navigation, dispatch, manifest.id]);
}
