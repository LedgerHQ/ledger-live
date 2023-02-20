// @flow
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { Flex, Button as BaseButton, Text, Tag, Icons } from "@ledgerhq/react-ui";
import styled from "@ledgerhq/react-ui/components/styled";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { ModalBody } from "~/renderer/components/Modal";
import TrackPage from "~/renderer/analytics/TrackPage";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import GetItOnGooglePlayImage from "./images/get_it_on_google_play.png";
import GetItOnAppleStoreImage from "./images/get_it_on_apple_store.png";
import QrCodeLLMImages from "./images/QRcode_LLM.png";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

type Props = {
  onClose: () => void,
};

const StyledImgLink = styled("a").attrs(() => ({}))`
  cursor: pointer;
`;

const ProtectDiscoverBody = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const protectServicesDiscoverDesktopFeature = useFeature("protectServicesDiscoverDesktop");

  const onAppStoreClick = () => openURL(urls.ledgerLiveMobile.appStore);
  const onPlayStoreClick = () => openURL(urls.ledgerLiveMobile.playStore);
  const onDiscoverClick = () =>
    openURL(protectServicesDiscoverDesktopFeature?.params?.discoverTheBenefitsLink);

  return (
    <ModalBody
      onClose={onClose}
      p={1}
      render={() => (
        <Flex flexDirection={"column"} px={7}>
          <TrackPage category="Modal" name="ReleaseNotes" />
          <Tag active type="plain" size={"medium"} alignSelf={"center"} mb={8}>
            {t("discoverProtect.new")}
          </Tag>
          <Text variant={"h4Inter"} mb={6}>
            {t("discoverProtect.title")}
          </Text>
          <Text variant={"bodyLineHeight"} color={"neutral.c70"}>
            {t("discoverProtect.description")}
          </Text>
          <BaseButton
            onClick={onDiscoverClick}
            variant={"main"}
            size={"medium"}
            Icon={Icons.PlusMedium}
            iconSize={18}
            mt={8}
          >
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
