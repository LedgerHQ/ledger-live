import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { createAction } from "redux-actions";
import { Data as CompleteExchangeData } from "~/renderer/modals/Platform/Exchange/CompleteExchange/Body";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";

export const openInformationCenter = createAction(
  "INFORMATION_CENTER_OPEN",
  (tabId: string | undefined) => ({
    tabId,
  }),
);
export const setTabInformationCenter = createAction(
  "INFORMATION_CENTER_SET_TAB",
  (tabId: string) => ({
    tabId,
  }),
);
export const closeInformationCenter = createAction("INFORMATION_CENTER_CLOSE");
export const openPlatformAppInfoDrawer = createAction(
  "PLATFORM_APP_DRAWER_OPEN",
  ({ manifest }: { manifest: LiveAppManifest | undefined | null }) => ({
    type: "DAPP_INFO",
    title: "platform.app.informations.title",
    manifest,
  }),
);
export const openExchangeDrawer = createAction(
  "EXCHANGE_APP_DRAWER_OPEN",
  ({
    type,
    ...data
  }:
    | {
        type: "EXCHANGE_START";
        exchangeType: ExchangeType;
        provider?: string;
        fromAccountId?: string;
        toAccountId?: string;
        tokenCurrency?: string;
        onResult: (nonce: string) => void;
        onCancel: (error: Error) => void;
      }
    | ({
        type: "EXCHANGE_COMPLETE";
      } & CompleteExchangeData)) => ({
    type,
    title: "swap2.exchangeDrawer.title",
    data,
  }),
);
export const openPlatformAppDisclaimerDrawer = createAction(
  "PLATFORM_APP_DRAWER_OPEN",
  ({
    manifest,
    disclaimerId,
    next,
  }: {
    manifest: LiveAppManifest | undefined | null;
    disclaimerId: string;
    next: (manifest: AppManifest, isChecked: boolean) => void;
  }) => ({
    type: "DAPP_DISCLAIMER",
    manifest,
    title: null,
    disclaimerId,
    next,
  }),
);
export const closePlatformAppDrawer = createAction("PLATFORM_APP_DRAWER_CLOSE");
