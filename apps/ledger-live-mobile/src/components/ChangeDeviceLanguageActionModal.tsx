import React, { useMemo } from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Language } from "@ledgerhq/types-live";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import DeviceActionModal from "./DeviceActionModal";
import DeviceLanguageInstalled from "./DeviceLanguageInstalled";

type Props = {
  device: Device | null;
  language: Language;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onResult?: () => void;
};

const action = createAction(installLanguage);
const ChangeDeviceLanguageActionModal: React.FC<Props> = ({
  device,
  language,
  onClose,
  onError,
  onResult,
}) => {
  const request = useMemo(() => ({ language }), [language]);

  return (
    <DeviceActionModal
      action={action}
      onClose={onClose}
      onError={onError}
      request={request}
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

export default ChangeDeviceLanguageActionModal;
