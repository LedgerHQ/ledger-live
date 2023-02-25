// @flow
import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button as BaseButton, Text } from "@ledgerhq/react-ui";
import styled from "@ledgerhq/react-ui/components/styled";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { ModalBody } from "~/renderer/components/Modal";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import GetItOnGooglePlayImage from "./images/get_it_on_google_play.png";
import GetItOnAppleStoreImage from "./images/get_it_on_apple_store.png";
import LedgerRecoverLogoDark from "./images/ledger_recover_dark.png";
import LedgerRecoverLogoLight from "./images/ledger_recover_light.png";
import QrCodeLLMImages from "./images/QRcode_LLM.png";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";
import { useTheme } from "styled-components";

type Props = {
  onClose: () => void,
};

const StyledImgLink = styled("a").attrs(() => ({}))`
  cursor: pointer;
`;

const ProtectDiscoverBody = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const protectServicesDiscoverDesktopFeature = useFeature("protectServicesDiscoverDesktop");
  const theme = useTheme();

  const onAppStoreClick = () => openURL(urls.ledgerLiveMobile.appStore);
  const onPlayStoreClick = () => openURL(urls.ledgerLiveMobile.playStore);
  const onDiscoverClick = () => {
    track("button_clicked", {
      button: "Discover the benefits",
    });
    openURL(protectServicesDiscoverDesktopFeature?.params?.discoverTheBenefitsLink);
  };
  return (
    <ModalBody
      onClose={onClose}
      p={1}
      render={() => (
        <Flex flexDirection={"column"} px={7}>
          <Flex margin={"auto"} mb={8}>
            <img
              src={theme.colors.type === "light" ? LedgerRecoverLogoLight : LedgerRecoverLogoDark}
              alt={"ledger recover"}
              width={"137"}
            />
          </Flex>
          <Text variant={"h4Inter"} textAlign={"center"} mb={6}>
            {t("discoverProtect.title")}
          </Text>
          <Text variant={"bodyLineHeight"} textAlign={"center"} color={"neutral.c70"}>
            {t("discoverProtect.description")}
          </Text>
          <BaseButton onClick={onDiscoverClick} variant={"main"} size={"medium"} mt={8}>
            {t("discoverProtect.cta")}
          </BaseButton>
          <Flex
            alignItems={"center"}
            mt={12}
            pt={12}
            borderTop="1px solid"
            borderColor="neutral.c40"
          >
            <Flex flexDirection={"column"} flexShrink={1} mr={7}>
              <Text
                variant={"body"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                flexShrink={1}
                mb={6}
              >
                {t("discoverProtect.downloadLLM")}
              </Text>
              <Flex>
                <StyledImgLink mr={4}>
                  <img
                    src={GetItOnGooglePlayImage}
                    onClick={onPlayStoreClick}
                    height={"38px"}
                    alt={"get it on google play"}
                  />
                </StyledImgLink>
                <StyledImgLink>
                  <img
                    src={GetItOnAppleStoreImage}
                    onClick={onAppStoreClick}
                    height={"38px"}
                    alt={"get it on apple store"}
                  />
                </StyledImgLink>
              </Flex>
            </Flex>
            <img src={QrCodeLLMImages} height={"128px"} width={"128px"} alt={"QR Code"} />
          </Flex>
        </Flex>
      )}
    />
  );
};

export default withV3StyleProvider(ProtectDiscoverBody);
