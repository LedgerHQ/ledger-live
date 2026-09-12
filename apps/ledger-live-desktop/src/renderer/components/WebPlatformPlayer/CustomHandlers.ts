import { useMemo } from "react";
import { ipcRenderer } from "electron";
import { useDispatch } from "LLD/hooks/redux";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { track } from "~/renderer/analytics/segment";
import { setLiveAppModal } from "~/renderer/reducers/liveAppModal";
import { WebviewProps } from "../Web3AppWebview/types";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import { isUrlSafe } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/isUrlSafe";
import { handlers as liveAppModalHandlers } from "@ledgerhq/live-common/wallet-api/LiveAppModal/server";
import { resolveLiveAppModalParams } from "@ledgerhq/live-common/wallet-api/LiveAppModal/types";

type DeeplinkOpenHandlerParams = { url: string };

type CreateDeeplinkOpenHandlerParams = {
  openDeepLink?: (url: string) => void;
};

export function createDeeplinkOpenHandler({
  openDeepLink = url => ipcRenderer.send("deep-linking", url),
}: CreateDeeplinkOpenHandlerParams = {}) {
  return (params?: DeeplinkOpenHandlerParams) => {
    if (!params) {
      return;
    }

    // Scheme allowlist is always enforced (not behind lwdDeeplinkOpenHardening).
    // That flag still gates locked-app deeplink deferral in useDeeplinking.
    if (!isUrlSafe(params.url)) {
      console.warn("Blocked unsafe custom.deeplink.open URL");
      track("custom.deeplink.open blocked", { reason: "scheme" });
      return;
    }

    openDeepLink(params.url);
  };
}

export function useDeeplinkCustomHandlers() {
  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": createDeeplinkOpenHandler(),
        },
      }),
    };
  }, []);
}

export function useLiveAppModalCustomHandlers(manifest: WebviewProps["manifest"]) {
  const dispatch = useDispatch();
  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...liveAppModalHandlers({
        uiHooks: {
          "custom.liveApp.modal.open": input => {
            dispatch(setLiveAppModal(resolveLiveAppModalParams(input, manifest.id)));
          },
        },
      }),
    };
  }, [dispatch, manifest.id]);
}
