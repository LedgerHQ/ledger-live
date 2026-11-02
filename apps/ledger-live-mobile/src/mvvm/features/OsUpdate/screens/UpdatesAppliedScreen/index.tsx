import React, { useCallback } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import { useOsUpdateTracking } from "../../analytics/TrackingProvider";
import { OsUpdateButton } from "../../analytics/types";

type UpdatesAppliedScreenProps = Readonly<{
  productName: string;
  isRestoreOnly: boolean;
  onClose: () => void;
}>;

export function UpdatesAppliedScreen({
  productName,
  isRestoreOnly,
  onClose,
}: UpdatesAppliedScreenProps) {
  const { trackClick } = useOsUpdateTracking();
  const onPressClose = useCallback(() => {
    trackClick(OsUpdateButton.CLOSE);
    onClose();
  }, [trackClick, onClose]);
  const keyPrefix = isRestoreOnly ? "osUpdates.restored" : "osUpdates.applied";

  return (
    <Box lx={{ flex: 1, padding: "s16" }}>
      <InfoState
        preset="success"
        title={<Trans i18nKey={`${keyPrefix}.title`} />}
        description={<Trans i18nKey={`${keyPrefix}.description`} values={{ productName }} />}
        primaryCta={{ label: <Trans i18nKey="osUpdates.actions.close" />, onPress: onPressClose }}
        testID="os-update-applied-screen"
      />
    </Box>
  );
}
