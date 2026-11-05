import React, { useCallback } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { RestoreBackupStatus } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import { useOsUpdateTracking } from "../../analytics/TrackingProvider";
import { OsUpdateButton } from "../../analytics/types";

type UpdatesAppliedScreenProps = Readonly<
  {
    productName: string;
    /** `undefined` when there was nothing to reinstall. */
    restoreStatus: RestoreBackupStatus | undefined;
    onClose: () => void;
  } & ({ isRestoreOnly: false; osVersion: string } | { isRestoreOnly: true })
>;

function getRestoreBannerKey(restoreStatus: RestoreBackupStatus | undefined) {
  switch (restoreStatus) {
    case RestoreBackupStatus.PARTIAL:
      return "osUpdates.restoreResult.partial";
    case RestoreBackupStatus.OUT_OF_MEMORY:
      return "osUpdates.restoreResult.outOfMemory";
    case RestoreBackupStatus.FULL:
    case undefined:
      return undefined;
    default: {
      const unhandled: never = restoreStatus;
      return unhandled;
    }
  }
}

export function UpdatesAppliedScreen(props: UpdatesAppliedScreenProps) {
  const { productName, restoreStatus, onClose } = props;
  const { trackClick } = useOsUpdateTracking();
  const onPressFinish = useCallback(() => {
    trackClick(OsUpdateButton.FINISH);
    onClose();
  }, [trackClick, onClose]);
  const bannerKey = getRestoreBannerKey(restoreStatus);

  return (
    <Box lx={{ flex: 1, padding: "s16" }}>
      <InfoState
        preset="success"
        title={
          <Trans
            i18nKey={props.isRestoreOnly ? "osUpdates.restored.title" : "osUpdates.applied.title"}
            values={{ productName }}
          />
        }
        description={
          props.isRestoreOnly ? undefined : (
            <Trans i18nKey="osUpdates.applied.version" values={{ version: props.osVersion }} />
          )
        }
        banner={
          bannerKey
            ? { description: <Trans i18nKey={bannerKey} />, testID: "os-update-restore-banner" }
            : undefined
        }
        primaryCta={{ label: <Trans i18nKey="osUpdates.actions.finish" />, onPress: onPressFinish }}
        testID="os-update-applied-screen"
      />
    </Box>
  );
}
