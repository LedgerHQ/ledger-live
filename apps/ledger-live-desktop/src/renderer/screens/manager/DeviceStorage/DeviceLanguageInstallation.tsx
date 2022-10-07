import React, { useState, useCallback, useEffect } from "react";
import { Button, Flex, Icons, Drawer, Radio, BoxedIcon, Divider, Log } from "@ledgerhq/react-ui";
import { DeviceInfo, Language } from "@ledgerhq/types-live";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
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
  currentLanguage: Language;
  onSelectLanguage: (language: Language) => void;
  device: Device;
};

const DeviceLanguageInstalled = ({
  onContinue,
  onMount,
}: {
  onContinue: () => void;
  onMount: () => void;
}) => {
  useEffect(() => onMount(), [onMount]);

  const { t } = useTranslation();

  return (
    <Flex height="100%" flexDirection="column" data-test-id="language-installed">
      <Flex flex={1} flexDirection="column" alignItems="center" justifyContent="center">
        <BoxedIcon Icon={Icons.CheckAloneMedium} iconColor="success.c100" size={64} iconSize={24} />
        <Log extraTextProps={{ fontSize: 20 }} alignSelf="stretch" mx={16} mt={10}>
          {t("deviceLocalization.languageInstalled")}
        </Log>
      </Flex>
      <Flex flexDirection="column" rowGap={10}>
        <Divider variant="light" />
        <Flex alignSelf="end">
          <Button
            variant="main"
            onClick={onContinue}
            data-test-id="close-language-installation-button"
          >
            {t("common.close")}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

const DeviceLanguageInstallation: React.FC<Props> = ({
  isOpen,
  onClose,
  deviceInfo,
  selectedLanguage,
  onSelectLanguage,
  currentLanguage,
  onSuccess,
}: Props) => {
  const { availableLanguages } = useAvailableLanguagesForDevice(deviceInfo);

  const [installing, setInstalling] = useState(false);

  const { t } = useTranslation();

  const onCloseDrawer = useCallback(() => {
    onClose();
    setInstalling(false);
  }, [onClose, setInstalling]);

  const Result = useCallback(() => {
    return <DeviceLanguageInstalled onContinue={onCloseDrawer} onMount={onSuccess} />;
  }, [onCloseDrawer, onSuccess]);

  const onChange = useCallback(
    (radioValue?: string | string[] | number) => onSelectLanguage(radioValue as Language),
    [onSelectLanguage],
  );

  const onInstall = useCallback(() => setInstalling(true), [setInstalling]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCloseDrawer}
      title={t("deviceLocalization.deviceLanguage")}
      big
    >
      <Flex flex={1} flexDirection="column" justifyContent="space-between" pt={2}>
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
                  containerProps={{
                    flex: 1,
                    padding: 0,
                  }}
                  label={({ checked }: { checked: boolean }) => (
                    <Flex flex={1} justifyContent="space-between">
                      <Radio.ListElement.Label
                        checked={checked}
                        data-test-id={`manager-language-option-${language}`}
                      >
                        {t(`deviceLocalization.languages.${language}`)}
                      </Radio.ListElement.Label>
                      {currentLanguage === language && (
                        <Icons.CircledCheckSolidMedium color="primary.c80" size={24} />
                      )}
                    </Flex>
                  )}
                  value={language}
                  key={language}
                />
              ))}
            </Radio>
            <Flex flexDirection="column" rowGap={10}>
              <Divider variant="light" />
              <Flex alignSelf="end">
                <Button
                  data-test-id="install-language-button"
                  variant="main"
                  onClick={onInstall}
                  disabled={currentLanguage === selectedLanguage}
                >
                  {t(`deviceLocalization.changeLanguage`)}
                </Button>
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
    </Drawer>
  );
};

export default DeviceLanguageInstallation;
