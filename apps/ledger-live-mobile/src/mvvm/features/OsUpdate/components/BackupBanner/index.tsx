import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { OsUpdateFlowMode } from "@features/flow-device-os-update";
import { BackupBanner as BackupBannerBlock } from "@features/flow-device-os-update/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { toDmkDevice } from "../../ports/osUpdateDevice";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";

export function BackupBanner({ device }: Readonly<{ device: Device }>) {
  const navigation = useNavigation<BaseNavigation>();
  const onRestore = useCallback(
    () =>
      navigation.navigate(ScreenName.OsUpdate, {
        device: toDmkDevice(device),
        mode: OsUpdateFlowMode.RESTORE_BACKUP,
      }),
    [navigation, device],
  );

  return (
    <BackupBannerBlock
      modelId={ledgerToDmkDeviceIdMap[device.modelId]}
      wired={device.wired}
      analyticsModelId={device.modelId}
      backupStorage={deviceBackupStorage}
      onRestore={onRestore}
    />
  );
}
