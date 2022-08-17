import React, { useMemo } from "react";

import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import DeviceAction from "./DeviceAction";
import { Language } from "@ledgerhq/types-live";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/installLanguage";
import installLanguage from "@ledgerhq/live-common/lib/hw/installLanguage";
import { useTranslation } from "react-i18next";
import {
  Flex,
  Alert,
} from "@ledgerhq/native-ui";
import DeviceLanguageInstalled from "./DeviceLanguageInstalled";

type Props = {
  device: Device;
  language: Language;
  onContinue: () => void;
  onResult?: () => void;
  onError?: () => void;
};


const ChangeDeviceLanguageAction: React.FC<Props> = ({
  device,
  language,
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

  return (
    <>
      <Flex flexDirection="row" mb={showAlert ? "16px" : 0}>
        <DeviceAction
          action={action}
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
