import React, { useEffect, useMemo } from "react";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Language } from "@ledgerhq/types-live";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import { useTranslation } from "react-i18next";
import { Flex, Alert } from "@ledgerhq/native-ui";
import DeviceAction from "./DeviceAction";
import DeviceLanguageInstalled from "./DeviceLanguageInstalled";

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
  const showAlert = !device?.wired;
  const { t } = useTranslation();

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
          // FIXME: request should be a Language in theory :/
          request={undefined}
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
      {showAlert && (
        <Alert type="info" title={t("DeviceAction.stayInTheAppPlz")} />
      )}
    </>
  );
};

export default ChangeDeviceLanguageAction;
