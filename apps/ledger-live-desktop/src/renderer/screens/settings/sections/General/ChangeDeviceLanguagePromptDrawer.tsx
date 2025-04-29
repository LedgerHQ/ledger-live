import React, { useCallback, useState } from "react";
import { Flex, Text, Button, Divider } from "@ledgerhq/react-ui";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";

import { DEFAULT_LANGUAGE, Language, Languages } from "~/config/languages";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import ChangeDeviceLanguagePrompt from "~/renderer/components/ChangeDeviceLanguagePrompt";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setDrawer } from "~/renderer/drawers/Provider";
import { CONNECTION_TYPES } from "~/renderer/analytics/hooks/variables";

export type Props = {
  currentLanguage: Language;
  analyticsContext: string;
  deviceModelInfo?: DeviceModelInfo;
  onClose?: () => void;
  onSuccess?: () => void;
  onError?: () => void;
  analyticsPayload?: {
    deviceType: string | undefined;
    connectionType: CONNECTION_TYPES;
  };
};

const ChangeDeviceLanguagePromptDrawer: React.FC<Props> = ({
  currentLanguage,
  analyticsContext,
  deviceModelInfo,
  onClose,
  onSuccess,
  onError,
  analyticsPayload = {},
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
      selectedLanguage: Languages[currentLanguage].deviceSupport?.label,
    });
    setLanguageInstalled(true);
  }, [onSuccess, analyticsContext, currentLanguage]);

  const handleError = useCallback(
    (error: Error) => {
      if (onError) onError();
      track(`${analyticsContext} LanguageInstallError`, { error });
      analyticsPayload &&
        track("User refused languageInstall on device", {
          ...analyticsPayload,
          platform: "LLD",
          flow: "SyncOnboarding",
        });
    },
    [onError, analyticsContext, analyticsPayload],
  );

  const getTextToDisplay = (key: "description" | "title") =>
    t(`deviceLocalization.changeDeviceLanguagePrompt.${key}`, {
      deviceName,
      language: t(
        `deviceLocalization.languages.${Languages[currentLanguage].deviceSupport?.label}`,
      ),
    });

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-testid="device-language-installation-container"
    >
      <Text alignSelf="center" variant="h5Inter" mb={3}>
        {t("deviceLocalization.deviceLanguage")}
      </Text>
      {installingLanguage ? (
        <>
          <ChangeDeviceLanguageAction
            language={
              Languages[currentLanguage].deviceSupport?.label ??
              DEFAULT_LANGUAGE.deviceSupport.label
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
                  data-testid="close-language-installation-button"
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
              selectedLanguage: Languages[currentLanguage].deviceSupport?.label,
            });
            setInstallingLanguage(true);
          }}
          titleWording={getTextToDisplay("title")}
          descriptionWording={getTextToDisplay("description")}
        />
      )}
    </Flex>
  );
};

export default withV3StyleProvider(React.memo(ChangeDeviceLanguagePromptDrawer));
