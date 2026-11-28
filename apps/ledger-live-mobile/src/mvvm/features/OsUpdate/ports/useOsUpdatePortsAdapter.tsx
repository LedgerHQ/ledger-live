import React, { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { OsUpdatePorts } from "@features/flow-device-os-update";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useSelector } from "~/context/hooks";
import { keepScreenAwake } from "./keepScreenAwake";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { SafeMarkdown } from "LLM/components/SafeMarkdown";
import { deviceBackupStorage } from "../storage/deviceBackupStorage";
import { getOsUpdateDeviceModel } from "./osUpdateDevice";

const openUrl = (url: string) => {
  Linking.openURL(url);
};

const renderReleaseNotes = (markdown: string) => <SafeMarkdown markdown={markdown} />;

/** Mobile implementation of the OS update flow ports. `null` until the DMK is available. */
export function useOsUpdatePortsAdapter(): OsUpdatePorts | null {
  const dmk = useDeviceManagementKit();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const supportUrl = useLocalizedUrl(urls.contact);

  const getLastSeenOsVersion = useCallback(
    (modelId: DeviceModelId) =>
      lastSeenDevice?.modelId === dmkToLedgerDeviceIdMap[modelId]
        ? lastSeenDevice.deviceInfo.version
        : undefined,
    [lastSeenDevice],
  );
  const openSupport = useCallback(() => openUrl(supportUrl), [supportUrl]);

  return useMemo(
    () =>
      dmk
        ? {
            dmk,
            backupStorage: deviceBackupStorage,
            getDeviceModel: getOsUpdateDeviceModel,
            getLastSeenOsVersion,
            keepScreenAwake,
            openUrl,
            openSupport,
            renderReleaseNotes,
          }
        : null,
    [dmk, getLastSeenOsVersion, openSupport],
  );
}
