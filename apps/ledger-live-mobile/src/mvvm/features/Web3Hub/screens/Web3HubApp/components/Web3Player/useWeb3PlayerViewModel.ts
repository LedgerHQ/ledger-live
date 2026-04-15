import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import type { RefObject } from "react";
import { useSelector } from "~/context/hooks";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import type { AppManifest, WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import {
  useACRECustomHandlers,
  useDeeplinkCustomHandlers,
} from "~/components/WebPlatformPlayer/CustomHandlers";
import { usePTXCustomHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { useCurrentAccountHistDB } from "~/screens/Platform/v2/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";

type CurrentAccountHistDB = ReturnType<typeof useCurrentAccountHistDB>;

export type Web3PlayerViewModelValues = {
  webviewAPIRef: RefObject<WebviewAPI | null>;
  isInfoPanelOpened: boolean;
  setIsInfoPanelOpened: React.Dispatch<React.SetStateAction<boolean>>;
  currentAccountHistDb: CurrentAccountHistDB[0];
  setCurrentAccountHistDb: CurrentAccountHistDB[1];
  currentAccountHistDbLoaded: CurrentAccountHistDB[2];
  customHandlers: WalletAPICustomHandlers;
};

type Params = {
  manifest: AppManifest;
  webviewState: WebviewState;
};

export default function useWeb3PlayerViewModel({
  manifest,
  webviewState,
}: Params): Web3PlayerViewModelValues {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

  const [currentAccountHistDb, setCurrentAccountHistDb, currentAccountHistDbLoaded] =
    useCurrentAccountHistDB();

  const handleHardwareBackPress = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    if (webviewState.canGoBack) {
      webview.goBack();
      return true;
    }

    return false;
  }, [webviewState.canGoBack]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        subscription.remove();
      };
    }
  }, [handleHardwareBackPress]);

  const accounts = useSelector(flattenAccountsSelector);
  const customACREHandlers = useACRECustomHandlers(manifest, accounts);
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      ...customACREHandlers,
      ...customPTXHandlers,
      ...customDeeplinkHandlers,
    };
  }, [customACREHandlers, customPTXHandlers, customDeeplinkHandlers]);

  return {
    webviewAPIRef,
    isInfoPanelOpened,
    setIsInfoPanelOpened,
    currentAccountHistDb,
    setCurrentAccountHistDb,
    currentAccountHistDbLoaded,
    customHandlers,
  };
}
