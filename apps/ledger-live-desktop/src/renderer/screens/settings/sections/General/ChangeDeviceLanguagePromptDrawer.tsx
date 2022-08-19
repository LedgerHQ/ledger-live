import React, { useCallback, useState } from "react";

import { Flex, Drawer, Button, Divider } from "@ledgerhq/react-ui";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";
import { useDispatch, useSelector } from "react-redux";
import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { DeviceInfo } from "@ledgerhq/types-live";
import { setLastSeenDevice } from "~/renderer/actions/settings";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { command } from "~/renderer/commands";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import ChangeDeviceLanguagePrompt from "~/renderer/components/ChangeDeviceLanguagePrompt";

type Props = {
  onClose: () => void;
  currentLanguage: Locale;
  isOpen: boolean;
};

const ChangeDeviceLanguagePromptDrawer: React.FC<Props> = ({
  onClose,
  isOpen,
  currentLanguage,
}) => {
  const [installingLanguage, setInstallingLanguage] = useState(false);
  const [languageInstalled, setLanguageInstalled] = useState(false);

  const currentDevice = useSelector(getCurrentDevice);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onCloseDrawer = useCallback(() => {
    setInstallingLanguage(false);
    setLanguageInstalled(false);
    onClose();
  }, [onClose]);

  const refreshDeviceInfo = useCallback(() => {
    if (currentDevice) {
      command("getDeviceInfo")(currentDevice.deviceId)
        .toPromise()
        .then((deviceInfo: DeviceInfo) => {
          dispatch(setLastSeenDevice({ deviceInfo }));
        });
    }
  }, [dispatch, currentDevice]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCloseDrawer}
      title={t("deviceLocalization.deviceLanguage")}
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
              onSuccess={() => {
                refreshDeviceInfo();
                setLanguageInstalled(true);
              }}
              onError={refreshDeviceInfo}
            />
            {languageInstalled && (
              <Flex flexDirection="column" rowGap={10} alignSelf="stretch">
                <Divider variant="light" />
                <Flex alignSelf="end">
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
            onSkip={onCloseDrawer}
            onConfirm={() => setInstallingLanguage(true)}
            titleWording={t("deviceLocalization.changeDeviceLanguage")}
            descriptionWording={t("deviceLocalization.changeDeviceLanguageDescription", {
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

export default withV3StyleProvider(ChangeDeviceLanguagePromptDrawer);
