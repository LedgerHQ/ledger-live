import React, { useCallback, useState } from "react";
import { Flex, Text, Button, Divider } from "@ledgerhq/react-ui";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";

import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { DeviceModelInfo, Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import ChangeDeviceLanguagePrompt from "~/renderer/components/ChangeDeviceLanguagePrompt";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setDrawer } from "~/renderer/drawers/Provider";

type Props = {
  currentLanguage: Locale;
  analyticsContext: string;
  deviceModelInfo?: DeviceModelInfo;
  onClose?: () => void;
  onSuccess?: () => void;
  onError?: () => void;
};

const ChangeDeviceLanguagePromptDrawer: React.FC<Props> = ({
  currentLanguage,
  analyticsContext,
  deviceModelInfo,
  onClose,
  onSuccess,
  onError,
}) => {
  const [installingLanguage, setInstallingLanguage] = useState(false);
  const [languageInstalled, setLanguageInstalled] = useState(false);

  const { t } = useTranslation();

  const onCloseDrawer = useCallback(() => {
    setInstallingLanguage(false);
    setLanguageInstalled(false);
    setDrawer(undefined);
    if (onClose) onClose();
  }, [onClose]);

  const deviceName = getDeviceModel(deviceModelInfo?.modelId ?? DeviceModelId.nanoX).productName;

  const handleSuccess = useCallback(() => {
    if (onSuccess) onSuccess();
    track(`${analyticsContext} LanguageInstalled`, {
      selectedLanguage: localeIdToDeviceLanguage[currentLanguage],
    });
    setLanguageInstalled(true);
  }, [onSuccess, analyticsContext, currentLanguage]);

  const handleError = useCallback(
    (error: Error) => {
      if (onError) onError();
      track(`${analyticsContext} LanguageInstallError`, { error });
    },
    [onError, analyticsContext],
  );

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-test-id="device-rename-container"
    >
      <Text alignSelf="center" variant="h5Inter" mb={3}>
        {t("deviceLocalization.deviceLanguage")}
      </Text>
      {installingLanguage ? (
        <>
          <ChangeDeviceLanguageAction
            language={
              localeIdToDeviceLanguage[currentLanguage as keyof typeof localeIdToDeviceLanguage] ??
              (localeIdToDeviceLanguage.en as Language)
            }
            onSuccess={handleSuccess}
            onError={handleError}
          />
          {languageInstalled && (
            <Flex flexDirection="column" rowGap={8} alignSelf="stretch">
              <Divider />
              <Flex alignSelf="end" pb={8} px={12}>
                <Button
                  variant="main"
                  onClick={onCloseDrawer}
                  data-test-id="close-language-installation-button"
                >
                  {t("common.close")}
                </Button>
              </Flex>
            </Flex>
          )}
        </>
      ) : (
        <ChangeDeviceLanguagePrompt
          deviceModelId={deviceModelInfo?.modelId ?? DeviceModelId.nanoX}
          onSkip={onCloseDrawer}
          onConfirm={() => {
            track(`${analyticsContext} LanguageInstallTriggered`, {
              selectedLanguage: localeIdToDeviceLanguage[currentLanguage],
            });
            setInstallingLanguage(true);
          }}
          titleWording={t("deviceLocalization.changeDeviceLanguagePrompt.title", {
            language: t(
              `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLanguage]}`,
            ),
            deviceName,
          })}
          descriptionWording={t("deviceLocalization.changeDeviceLanguagePrompt.description", {
            language: t(
              `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLanguage]}`,
            ),
          })}
        />
      )}
    </Flex>
  );
};

export default withV3StyleProvider(React.memo(ChangeDeviceLanguagePromptDrawer));
