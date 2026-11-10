import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { useFeature } from "@features/platform-feature-flags";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useMemo } from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export const EARN_DEPOSIT_WIDGET_PATH = "/deposit-widget";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_EARN_MANIFEST_ID || FEATURE_FLAGS_DEFAULTS.ptxEarnLiveApp.params?.manifest_id;

/** Appends the deposit widget path to a manifest url, keeping its origin and query. */
export const withDepositWidgetPath = (manifest: LiveAppManifest): LiveAppManifest => {
  try {
    const url = new URL(manifest.url.toString());
    url.pathname = `${url.pathname.replace(/\/+$/, "")}${EARN_DEPOSIT_WIDGET_PATH}`;
    return { ...manifest, url };
  } catch {
    return manifest;
  }
};

/** Resolves the Earn manifest the same way the Earn screen does, pointed at the deposit widget. */
export const useEarnDepositManifest = (): LiveAppManifest | undefined => {
  const earnFlag = useFeature("ptxEarnLiveApp");
  const manifestId = earnFlag?.enabled ? earnFlag.params?.manifest_id : DEFAULT_MANIFEST_ID;
  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest || remoteManifest;
  return useMemo(() => (manifest ? withDepositWidgetPath(manifest) : undefined), [manifest]);
};
