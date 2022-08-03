import React, { useEffect, useMemo } from "react";

import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import DeviceActionModal from "./DeviceActionModal";
import { Language } from "@ledgerhq/types-live";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/installLanguage";
import installLanguage from "@ledgerhq/live-common/lib/hw/installLanguage";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, Text, Button, Icons } from "@ledgerhq/native-ui";

type Props = {
  device: Device | null;
  language: Language;
  onClose?: () => void;
  onResult?: () => void;
};

const DeviceLanguageInstalled: React.FC<{
  onContinue?: () => void;
  onMount?: () => void;
  installedLanguage: Language;
}> = ({ onContinue, onMount, installedLanguage }) => {
  useEffect(() => {
    if(onMount) {
      onMount()
    }
  }, [onMount]);
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <BoxedIcon
        Icon={Icons.CheckAloneMedium}
        iconColor="success.c100"
        size={48}
        iconSize={24}
      />
      <Text variant="h4" textAlign="center" my={7} fontWeight="semiBold">
        {t("deviceLocalization.languageInstalled", {
          language: t(`deviceLocalization.languages.${installedLanguage}`),
        })}
      </Text>
      <Button type="main" alignSelf="stretch" onPress={onContinue}>
        {t("common.continue")}
      </Button>
    </Flex>
  );
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
