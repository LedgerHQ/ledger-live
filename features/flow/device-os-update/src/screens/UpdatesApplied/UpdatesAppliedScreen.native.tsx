import React, { useCallback } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { RestoreStatus } from "@domain/entity-device-os-update";
import { InfoState } from "@shared/ui-info-state";
import { Trans, useTranslation } from "@shared/i18n";
import { useOsUpdateTracking } from "../../hooks/OsUpdateTrackingProvider";
import { OsUpdateButton } from "../../analytics/analyticsTypes";

type UpdatesAppliedScreenProps = Readonly<
  {
    productName: string;
    /** `undefined` when there was nothing to reinstall. */
    restoreStatus: RestoreStatus | undefined;
    onClose: () => void;
  } & ({ isRestoreOnly: false; osVersion: string } | { isRestoreOnly: true })
>;

function getRestoreBannerKey(restoreStatus: RestoreStatus | undefined) {
  switch (restoreStatus) {
    case RestoreStatus.partial:
      return "osUpdates.restoreResult.partial";
    case RestoreStatus.outOfMemory:
      return "osUpdates.restoreResult.outOfMemory";
    case RestoreStatus.full:
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
  const { t } = useTranslation();
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
          props.isRestoreOnly ? (
            <Trans i18nKey="osUpdates.restored.description" />
          ) : (
            <Trans i18nKey="osUpdates.applied.version" values={{ version: props.osVersion }} />
          )
        }
        banner={
          bannerKey ? { description: t(bannerKey), testID: "os-update-restore-banner" } : undefined
        }
        primaryCta={{ label: <Trans i18nKey="osUpdates.actions.finish" />, onPress: onPressFinish }}
        testID="os-update-applied-screen"
      />
    </Box>
  );
}
