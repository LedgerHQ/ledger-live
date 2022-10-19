import React, { useState, useCallback, useMemo } from "react";
import { Button, Flex, Icons, Drawer, Radio, Divider, Text } from "@ledgerhq/react-ui";
import { DeviceInfo, Language } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "react-i18next";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deviceInfo: DeviceInfo;
  onSuccess: () => void;
  onError: (error: Error) => void;
  selectedLanguage: Language;
  currentLanguage: Language;
  onSelectLanguage: (language: Language) => void;
  device: Device;
};

const DeviceLanguageInstallation: React.FC<Props> = ({
  isOpen,
  onClose,
  deviceInfo,
  device,
  selectedLanguage,
  onSelectLanguage,
  onError,
  currentLanguage,
  onSuccess,
}: Props) => {
  const { availableLanguages } = useAvailableLanguagesForDevice(deviceInfo);
  const { t } = useTranslation();

  const sortedAvailableLanguages = useMemo(
    () =>
      availableLanguages.sort((a, b) =>
        t(`deviceLocalization.languages.${a}`).localeCompare(
          t(`deviceLocalization.languages.${b}`),
        ),
      ),
    [availableLanguages, t],
  );

  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  const onCloseDrawer = useCallback(() => {
    onClose();
    setInstalling(false);
    setInstalled(false);
  }, [onClose, setInstalling]);

  const onChange = useCallback(
    (radioValue?: string | string[] | number) => onSelectLanguage(radioValue as Language),
    [onSelectLanguage],
  );

  const onInstall = useCallback(() => {
    setInstalling(true);
    track("Page Manager LanguageInstallTriggered", { selectedLanguage });
  }, [setInstalling, selectedLanguage]);

  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCloseDrawer}
      extraContainerProps={{ p: 0 }}
      title={t("deviceLocalization.deviceLanguage")}
      big
    >
      <Flex flex={1} flexDirection="column" justifyContent="space-between">
        {installing ? (
          <ChangeDeviceLanguageAction
            onSuccess={() => {
              onSuccess();
              setInstalled(true);
            }}
            onError={onError}
            language={selectedLanguage}
          />
        ) : (
          <Flex px={12} flexDirection="column">
            <Text textAlign="center" mb={10} variant="body" color="neutral.c70">
              {t("deviceLocalization.chooseLanguage", { deviceName })}
            </Text>
            <Radio
              currentValue={selectedLanguage}
              onChange={onChange}
              name="LanguageSelection"
              containerProps={{ flexDirection: "column", rowGap: "1rem", flex: 1 }}
            >
              {sortedAvailableLanguages.map(language => (
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
          </Flex>
        )}
        {(!installing || installed) && (
          <Flex flexDirection="column" rowGap={8}>
            <Divider variant="light" />
            <Flex alignSelf="end" px={12} pb={8}>
              <Button
                data-test-id={
                  installed ? "close-language-installation-button" : "install-language-button"
                }
                variant="main"
                onClick={installed ? onCloseDrawer : onInstall}
                disabled={!installing && currentLanguage === selectedLanguage}
              >
                {installed ? t(`common.close`) : t(`deviceLocalization.changeLanguage`)}
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Drawer>
  );
};

export default DeviceLanguageInstallation;
