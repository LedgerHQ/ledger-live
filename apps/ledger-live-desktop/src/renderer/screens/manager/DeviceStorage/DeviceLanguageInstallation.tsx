import React, { useState, useCallback, useEffect } from "react";
import { Button, Flex, Icons, Drawer, Radio, BoxedIcon, Text } from "@ledgerhq/react-ui";
import { DeviceInfo } from "@ledgerhq/live-common/types/manager";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Language } from "@ledgerhq/live-common/types/languages";
import { command } from "~/renderer/commands";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "react-i18next";

const installLanguageExec = command("installLanguage");
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : installLanguageExec);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deviceInfo: DeviceInfo;
  onSuccess: () => void;
  selectedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
  device: Device;
};

const DeviceLanguageInstalled = ({
  onContinue,
  onMount,
  installedLanguage,
}: {
  onContinue: () => void;
  onMount: () => void;
  installedLanguage: Language;
}) => {
  useEffect(() => onMount(), [onMount]);

  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" alignItems="center" height="100%" justifyContent="center">
      <BoxedIcon Icon={Icons.CheckAloneMedium} iconColor="success.c100" size={48} iconSize={24} />
      <Text variant="h4" textAlign="center" my={7}>
        {t("deviceLocalization.languageInstalled", {
          language: t(`deviceLocalization.languages.${installedLanguage}`),
        })}
      </Text>
      <Button variant="main" alignSelf="stretch" onClick={onContinue}>
        {t("common.continue")}
      </Button>
    </Flex>
  );
};

const DeviceLanguageInstallation: React.FC<Props> = ({
  isOpen,
  onClose,
  deviceInfo,
  selectedLanguage,
  onSelectLanguage,
  onSuccess,
}: Props) => {
  const availableLanguages = useAvailableLanguagesForDevice(deviceInfo);

  const [installing, setInstalling] = useState(false);

  const { t } = useTranslation();

  const onCloseDrawer = useCallback(() => {
    onClose();
    setInstalling(false);
  }, [onClose, setInstalling]);

  const Result = useCallback(() => {
    return (
      <DeviceLanguageInstalled
        installedLanguage={selectedLanguage}
        onContinue={onCloseDrawer}
        onMount={onSuccess}
      />
    );
  }, [selectedLanguage, onCloseDrawer, onSuccess]);

  const onChange = useCallback(
    (radioValue?: string | string[] | number) => onSelectLanguage(radioValue as Language),
    [onSelectLanguage],
  );

  return (
    <Drawer isOpen={isOpen} onClose={onCloseDrawer} title="Device Language" big>
      <Flex flex={1} p={10} flexDirection="column" justifyContent="space-between">
        {installing ? (
          <DeviceAction action={action} request={selectedLanguage} Result={Result} />
        ) : (
          <>
            <Radio
              currentValue={selectedLanguage}
              onChange={onChange}
              name="LanguageSelection"
              containerProps={{ flexDirection: "column", rowGap: "1rem", flex: 1 }}
            >
              {availableLanguages.map(language => (
                <Radio.ListElement
                  containerProps={{ flex: 1, padding: 0 }}
                  label={t(`deviceLocalization.languages.${language}`)}
                  value={language}
                  key={language}
                />
              ))}
            </Radio>
            <Button variant="main" onClick={() => setInstalling(true)}>
              Change Language
            </Button>
          </>
        )}
      </Flex>
    </Drawer>
  );
};

export default DeviceLanguageInstallation;
