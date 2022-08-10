import React, { useCallback, useState } from "react";

import { Flex, Drawer, Text, Button } from "@ledgerhq/react-ui";
import ChangeDeviceLanguageAction from "~/renderer/components/ChangeDeviceLanguageAction";
import Illustration from "~/renderer/components/Illustration";
import NanoXFoldedDark from "./assets/nano-x-folded-dark.svg";
import NanoXFoldedLight from "./assets/nano-x-folded-light.svg";
import { useDispatch, useSelector } from "react-redux";
import { Locale, localeIdToDeviceLanguage } from "~/config/languages";
import { DeviceInfo } from "@ledgerhq/types-live";
import { setLastSeenDevice } from "~/renderer/actions/settings";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { command } from "~/renderer/commands";
import { getCurrentDevice } from "~/renderer/reducers/devices";

type Props = {
  onClose: () => void;
  currentLanguage: Locale;
  isOpen: boolean;
};

const ChangeDeviceLanguagePrompt: React.FC<Props> = ({ onClose, isOpen, currentLanguage }) => {
  const [installingLanguage, setInstallingLanguage] = useState(false);

  const currentDevice = useSelector(getCurrentDevice);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onCloseDrawer = useCallback(() => {
    setInstallingLanguage(false);
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
          <ChangeDeviceLanguageAction
            language={localeIdToDeviceLanguage[currentLanguage]}
            onSuccess={refreshDeviceInfo}
            onError={refreshDeviceInfo}
            onContinue={onCloseDrawer}
          />
        ) : (
          <>
            <Flex
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              flex={1}
              px={40}
            >
              <Illustration
                width={251}
                height={126}
                lightSource={NanoXFoldedLight}
                darkSource={NanoXFoldedDark}
              />

              <Text variant="h1" fontSize={20} mt={80}>
                {t("deviceLocalization.changeDeviceLanguage")}
              </Text>
              <Text variant="body" textAlign="center" color="neutral.c80" mt={24}>
                {t("deviceLocalization.changeDeviceLanguageDescription", {
                  language: t(
                    `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLanguage]}`,
                  ),
                })}
              </Text>
            </Flex>
            <Flex alignSelf="flex-end" justifySelf="flex-end" columnGap={5}>
              <Button onClick={onCloseDrawer}>{t("common.cancel")}</Button>
              <Button variant="main" onClick={() => setInstallingLanguage(true)}>
                {t("deviceLocalization.changeLanguage")}
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </Drawer>
  );
};

export default withV3StyleProvider(ChangeDeviceLanguagePrompt);
