import { handlers as exchangeHandlers } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import Config from "react-native-config";

import { sendEarnLiveAppReady } from "../../../../../e2e/bridge/client";

export function useEarnCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
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
      ...exchangeHandlers({
        accounts,
        tracking,
        manifest,
        uiHooks: {
          // TODO: decouple isReady handler from the Exchange handlers for Swap/Sell. Only isReady is needed for Earn live app.
          "custom.exchange.start": () => {},
          "custom.exchange.complete": () => {},
          "custom.exchange.error": () => {},
          "custom.isReady": async () => {
            if (Config.DETOX) {
              sendEarnLiveAppReady();
            }
          },
        },
      })["custom.isReady"],
    };
  }, [accounts, manifest, tracking]);
}
