import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { Box, Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import { useNavigateToPostOnboardingHubCallback } from "./logic/useNavigateToPostOnboardingHubCallback";
import Illustration from "~/renderer/components/Illustration";

import bannerStaxLight from "./assets/bannerStaxLight.svg";
import bannerStaxDark from "./assets/bannerStaxDark.svg";

import { useHistory } from "react-router-dom";

const CloseButtonWrapper = styled(Box).attrs(() => ({
  top: 4,
  right: 4,
  position: "absolute",
}))`
  cursor: pointer;
`;

const PostOnboardingHubBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();

  const handleNavigateToPostOnboardingHub = useCallback(() => navigateToPostOnboardingHub(), [
    navigateToPostOnboardingHub,
  ]);

  const handleHidePostOnboardingHubBanner = useCallback(() => setIsVisible(false), []);

  if (!isVisible) return null;
  return (
    <Flex
      backgroundColor="neutral.c100"
      borderRadius="8px"
      justifyContent="space-between"
      px={"40px"}
      mb="20px"
    >
      <Flex flexDirection="column" justifyContent="center" alignItems="flex-start">
        <Text color="neutral.c00" variant="paragraph" fontSize="18px">
          {t("postOnboarding.postOnboardingBanner.title")}
        </Text>
        <Text mt="8px" mb="18px" color="neutral.c50" whiteSpace="pre-wrap" fontSize="14px">
          {t("postOnboarding.postOnboardingBanner.description")}
        </Text>
        <Link color="neutral.c00" onClick={handleNavigateToPostOnboardingHub}>
          {t("postOnboarding.postOnboardingBanner.link")}
        </Link>
      </Flex>
      <Flex>
        <Illustration lightSource={bannerStaxLight} darkSource={bannerStaxDark} size={240} />
      </Flex>
      <CloseButtonWrapper onClick={handleHidePostOnboardingHubBanner}>
        <Icons.CloseMedium color="neutral.c00" size={30} />
      </CloseButtonWrapper>
    </Flex>
  );
};

export default PostOnboardingHubBanner;
