import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React, { memo } from "react";
import { Image, ImageBackground } from "react-native";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

import Touchable from "../Touchable";

import LedgerRecoverLogoLight from "~/images/ledger_recover_light.png";
import LedgerRecoverBackground from "~/images/ledger_recover_card_background.png";
import { useProtect } from "./Protect/useProtect";

function ServicesWidget() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { displayService, onClickFreeTrial, onClickCard, onClickSignIn } = useProtect();

  return displayService ? (
    <Flex>
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center" mb={6} mt={8}>
        <Text variant="h5" fontWeight="semiBold">
          {t("servicesWidget.title")}
        </Text>

        <Touchable onPress={onClickSignIn}>
          <Text color="primary.c90" mr={3} variant="body">
            {t("servicesWidget.signIn")}
          </Text>
        </Touchable>
      </Flex>
      <StyledTouchable onPress={onClickCard}>
        <ImageBackground
          source={LedgerRecoverBackground}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 30,
          }}
          imageStyle={{
            borderRadius: theme.space[4],
          }}
        >
          <TagComponent bg="opacityReverse.c50" borderRadius={1} px={2} py={1}>
            <Text variant="small" fontWeight="semiBold" color="neutral.c100" numberOfLines={1}>
              {t("servicesWidget.recover.tag")}
            </Text>
          </TagComponent>

          <ImageComponent>
            <Image source={LedgerRecoverLogoLight} style={{ width: 90, height: 26 }} />
          </ImageComponent>
        </ImageBackground>
      </StyledTouchable>

      <Text color="neutral.c80" fontWeight="semiBold" my={4}>
        {t("servicesWidget.recover.desc")}
      </Text>

      <Button type="main" onPress={onClickFreeTrial} style={{ alignSelf: "flex-start" }} mb={8}>
        <Text variant="body" fontWeight="semiBold" color="neutral.c00">
          {t("servicesWidget.recover.cta")}
        </Text>
      </Button>
    </Flex>
  ) : null;
}

const StyledTouchable = styled(Touchable)`
  height: 110px;
`;

const TagComponent = styled(Flex)`
  position: absolute;
  right: 9px;
  top: 9px;
`;

const ImageComponent = styled(Flex)``;

export default memo(ServicesWidget);
