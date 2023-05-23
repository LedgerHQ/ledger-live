import { Flex, Text } from "@ledgerhq/native-ui";
import React, { memo, useCallback } from "react";
import { Linking, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  useAlreadySubscribedURI,
  useLearnMoreURI,
} from "@ledgerhq/live-common/hooks/recoverFeatueFlag";
import NewProtectState from "./Protect/NewProtectState";
import { ServicesConfigParams } from "./types";
import Touchable from "../Touchable";

import LedgerRecoverLogoLight from "../../images/ledger_recover_light.png";
import LedgerRecoverLogoDark from "../../images/ledger_recover_dark.png";

import LedgerRecoverCardTopImage from "../../images/ledger_recover_card_top.png";

function ServicesWidget() {
  const { t } = useTranslation();
  const servicesConfig = useFeature<ServicesConfigParams>(
    "protectServicesMobile",
  );
  const theme = useTheme();

  const learnMoreURI = useLearnMoreURI(servicesConfig);
  const alreadySubscribedURI = useAlreadySubscribedURI(servicesConfig);

  const onCardPress = useCallback(() => {
    if (alreadySubscribedURI) {
      Linking.canOpenURL(alreadySubscribedURI).then(() =>
        Linking.openURL(alreadySubscribedURI),
      );
    }
  }, [alreadySubscribedURI]);

  return servicesConfig?.enabled && learnMoreURI && alreadySubscribedURI ? (
    <>
      <Text mt={10} fontWeight="semiBold" variant="h5" mb={6}>
        {t("servicesWidget.title")}
      </Text>
      <Touchable onPress={onCardPress}>
        <Flex bg="neutral.c30" borderRadius={8} mb={13} overflow="hidden">
          <Image
            source={LedgerRecoverCardTopImage}
            resizeMode={"stretch"}
            style={{ width: "100%", height: 8 }}
          />
          <Flex p={7}>
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              mb={6}
            >
              <Image
                source={
                  theme.colors.type === "light"
                    ? LedgerRecoverLogoLight
                    : LedgerRecoverLogoDark
                }
                style={{ width: 90, height: 26 }}
              />
              <NewProtectState.StatusTag />
            </Flex>
            <Text variant="body" color="neutral.c80" mb={7}>
              {t(`servicesWidget.protect.status.new.desc`)}
            </Text>
            <NewProtectState params={{ learnMoreURI, alreadySubscribedURI }} />
          </Flex>
        </Flex>
      </Touchable>
    </>
  ) : null;
}

export default memo(ServicesWidget);
