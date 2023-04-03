import React, { useCallback, useState } from "react";

import { Flex, Drawer, Button, Divider } from "@ledgerhq/react-ui";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";
import { useDispatch, useSelector } from "react-redux";
import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { DeviceInfo } from "@ledgerhq/types-live";
import { setLastSeenDevice } from "~/renderer/actions/settings";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import ChangeDeviceLanguagePrompt from "~/renderer/components/ChangeDeviceLanguagePrompt";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import isEqual from "lodash/isEqual";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";

type Props = {
  onClose: () => void;
  currentLanguage: Locale;
  isOpen: boolean;
  deviceModelId: DeviceModelId;
};

const ChangeDeviceLanguagePromptDrawer: React.FC<Props> = ({
  onClose,
  isOpen,
  currentLanguage,
  deviceModelId,
}) => {
  const [installingLanguage, setInstallingLanguage] = useState(false);
  const [languageInstalled, setLanguageInstalled] = useState(false);

  const currentDevice = useSelector(getCurrentDevice);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onCloseDrawer = useCallback(() => {
    setInstallingLanguage(false);
    setLanguageInstalled(false);
    onClose();
  }, [onClose]);

  const refreshDeviceInfo = useCallback(() => {
    if (currentDevice) {
      withDevice(currentDevice.deviceId)(transport => from(getDeviceInfo(transport)))
        .toPromise()
        .then((deviceInfo: DeviceInfo) => {
          if (!isEqual(deviceInfo, lastSeenDevice?.deviceInfo))
            dispatch(setLastSeenDevice({ deviceInfo }));
        });
    }
  }, [dispatch, currentDevice, lastSeenDevice]);

  const deviceName = getDeviceModel(deviceModelId).productName;

  const handleSuccess = useCallback(() => {
    refreshDeviceInfo();
    track("Page LiveLanguageChange LanguageInstalled", {
      selectedLanguage: localeIdToDeviceLanguage[currentLanguage],
    });
    setLanguageInstalled(true);
  }, [currentLanguage, refreshDeviceInfo]);

  const handleError = useCallback(
    (error: Error) => {
      refreshDeviceInfo();
      track("Page LiveLanguageChange LanguageInstallError", { error });
    },
    [refreshDeviceInfo],
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCloseDrawer}
      title={t("deviceLocalization.deviceLanguage")}
      extraContainerProps={{ p: 0 }}
      big
    >
      <Flex
        flex={1}
        flexDirection="column"
        justifyContent="space-evenly"
        alignItems="center"
        pt={2}
      >
        {installingLanguage ? (
          <>
            <ChangeDeviceLanguageAction
              language={localeIdToDeviceLanguage[currentLanguage]}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            {languageInstalled && (
              <Flex flexDirection="column" rowGap={8} alignSelf="stretch">
                <Divider variant="light" />
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
            deviceModelId={deviceModelId}
            onSkip={onCloseDrawer}
            onConfirm={() => {
              track("Page LiveLanguageChange LanguageInstallTriggered", {
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
    </Drawer>
  );
};

export default withV3StyleProvider(React.memo(ChangeDeviceLanguagePromptDrawer));
