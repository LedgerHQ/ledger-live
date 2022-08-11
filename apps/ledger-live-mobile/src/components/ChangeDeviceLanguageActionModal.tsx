import React, { useMemo } from "react";

import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import DeviceActionModal from "./DeviceActionModal";
import { Language } from "@ledgerhq/types-live";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/installLanguage";
import installLanguage from "@ledgerhq/live-common/lib/hw/installLanguage";
import DeviceLanguageInstalled from "./DeviceLanguageInstalled";

type Props = {
  device: Device | null;
  language: Language;
  onClose?: () => void;
  onResult?: () => void;
};

const ChangeDeviceLanguageAction: React.FC<Props> = ({
  device,
  language,
  onClose,
  onResult,
}) => {
  const action = useMemo(
    () =>
      createAction(() =>
        installLanguage({
          deviceId: device?.deviceId ?? "",
          language,
        }),
      ),
    [language, device?.deviceId],
  );

  return (
    <DeviceActionModal
      action={action}
      onClose={onClose}
      device={device}
      renderOnResult={() => (
        <DeviceLanguageInstalled
          onContinue={onClose}
          onMount={onResult}
          installedLanguage={language}
        />
      )}
    />
  );
};

export default ChangeDeviceLanguageAction;
