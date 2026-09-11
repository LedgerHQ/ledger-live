import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { WebviewProps } from "../Web3AppWebview/types";
import { useDispatch, useSelector } from "~/context/hooks";
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
