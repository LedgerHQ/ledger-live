import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { createAction } from "redux-actions";
export const openInformationCenter = createAction("INFORMATION_CENTER_OPEN", (tabId: string) => ({
  tabId,
}));
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
export const openPlatformAppDisclaimerDrawer = createAction(
  "PLATFORM_APP_DRAWER_OPEN",
  ({
    manifest,
    disclaimerId,
    next,
  }: {
    manifest: LiveAppManifest | undefined | null;
    disclaimerId: string;
    next: () => void;
  }) => ({
    type: "DAPP_DISCLAIMER",
    manifest,
    title: null,
    disclaimerId,
    next,
  }),
);
export const closePlatformAppDrawer = createAction("PLATFORM_APP_DRAWER_CLOSE");
