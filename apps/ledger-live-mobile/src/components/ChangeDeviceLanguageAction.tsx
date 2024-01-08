import React, { useEffect, useMemo } from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { Flex, Alert } from "@ledgerhq/native-ui";
import DeviceAction from "./DeviceAction";
import DeviceLanguageInstalled from "./DeviceLanguageInstalled";
import { useInstallLanguageDeviceAction } from "~/hooks/deviceActions";

type Props = {
  device: Device;
  language: Language;
  onContinue: () => void;
  onStart?: () => void;
  onResult?: () => void;
  onError?: (err: Error) => void;
};

const ChangeDeviceLanguageAction: React.FC<Props> = ({
  device,
  language,
  onStart,
  onContinue,
  onResult,
  onError,
}) => {
  const action = useInstallLanguageDeviceAction();
  const showAlert = !device?.wired;
  const { t } = useTranslation();
  const request = useMemo(() => ({ language }), [language]);

  useEffect(() => {
    if (onStart && device) {
      onStart();
    }
  }, [device, onStart]);

  return (
    <>
      <Flex flexDirection="row" mb={showAlert ? "16px" : 0}>
        <DeviceAction
          action={action}
          request={request}
          device={device}
          onError={onError}
          renderOnResult={() => (
            <DeviceLanguageInstalled
              onContinue={onContinue}
              onMount={onResult}
              installedLanguage={language}
            />
          )}
        />
      </Flex>
      {showAlert && <Alert type="info" title={t("DeviceAction.stayInTheAppPlz")} />}
    </>
  );
};

export default ChangeDeviceLanguageAction;
