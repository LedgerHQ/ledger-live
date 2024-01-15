import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  Flex,
  IconsLegacy,
  Radio,
  Divider,
  Text,
  InfiniteLoader,
} from "@ledgerhq/react-ui";
import { DeviceInfo, Language } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "react-i18next";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  deviceInfo: DeviceInfo;
  onSuccess: (selectedLanguage: Language) => void;
  onError: (error: Error) => void;
  currentLanguage: Language;
  device: Device;
};

const DeviceLanguageInstallation: React.FC<Props> = ({
  onClose,
  deviceInfo,
  onError,
  currentLanguage,
  onSuccess,
}: Props) => {
  const { availableLanguages } = useAvailableLanguagesForDevice(deviceInfo);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const { t } = useTranslation();

  const sortedAvailableLanguages = useMemo(
    () =>
      (availableLanguages as string[]).sort((a, b) =>
        t(`deviceLocalization.languages.${a}`).localeCompare(
          t(`deviceLocalization.languages.${b}`),
        ),
      ),
    [availableLanguages, t],
  );

  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  const onCloseDrawer = useCallback(() => {
    onClose?.();
    setInstalling(false);
    setInstalled(false);
  }, [onClose, setInstalling]);

  const onChange = useCallback(
    (radioValue?: string | number | readonly string[] | undefined) =>
      setSelectedLanguage(radioValue as Language),
    [setSelectedLanguage],
  );

  const onInstall = useCallback(() => {
    setInstalling(true);
    track("Page Manager LanguageInstallTriggered", { selectedLanguage });
  }, [setInstalling, selectedLanguage]);

  const onWrappedError = useCallback(
    (error: Error) => {
      setError(error);
      onError(error);
    },
    [onError],
  );

  const onRetry = useCallback(() => {
    setError(null);
    setNonce(nonce => nonce + 1);
  }, []);

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      key={`${nonce}_deviceRename`}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-test-id="device-language-installation-container"
    >
      <Text alignSelf="center" variant="h5Inter" mb={12}>
        {t("deviceLocalization.deviceLanguage")}
      </Text>
      <Flex px={12} flex={1}>
        {availableLanguages?.length ? (
          installing ? (
            <ChangeDeviceLanguageAction
              onSuccess={() => {
                onSuccess(selectedLanguage);
                setInstalled(true);
              }}
              onError={onWrappedError}
              language={selectedLanguage}
            />
          ) : (
            <Flex flexGrow={1} flexDirection="column">
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
                          <IconsLegacy.CircledCheckSolidMedium color="primary.c80" size={24} />
                        )}
                      </Flex>
                    )}
                    value={language}
                    key={language}
                  />
                ))}
              </Radio>
            </Flex>
          )
        ) : (
          <Flex flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center">
            <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
              <InfiniteLoader size={58} />
            </Flex>
          </Flex>
        )}
      </Flex>

      {!installing || (installing && error) || installed ? (
        <Flex flexDirection="column" alignSelf="stretch">
          <Divider />
          <Flex
            px={12}
            alignSelf="stretch"
            flexDirection="row"
            justifyContent="space-between"
            pt={4}
            pb={1}
          >
            <Flex flex={1} />
            {error ? (
              <Button
                data-test-id="retry-language-installation-button"
                variant="main"
                onClick={onRetry}
                disabled={!installing && currentLanguage === selectedLanguage}
              >
                {t(`common.retry`)}
              </Button>
            ) : (
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
            )}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

export default withV3StyleProvider(DeviceLanguageInstallation);
