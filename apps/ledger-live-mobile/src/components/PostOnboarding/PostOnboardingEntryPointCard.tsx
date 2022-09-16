import React, { useCallback } from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices/lib/index";
import styled from "styled-components/native";
import { useDispatch, useSelector } from "react-redux";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { hidePostOnboardingWalletEntryPoint } from "@ledgerhq/live-common/postOnboarding/actions";
import { postOnboardingDeviceModelIdSelector } from "@ledgerhq/live-common/lib/postOnboarding/reducer";
import { useNavigateToPostOnboardingHubCallback } from "../../logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import Touchable from "../Touchable";
import darkPlaceholderImage from "../../images/illustration/Dark/_000_PLACEHOLDER.png";
import lightPlaceholderImage from "../../images/illustration/Light/_000_PLACEHOLDER.png";

const PlaceholderImage = styled.Image.attrs(p => ({
  source:
    p.theme.colors.type === "dark"
      ? darkPlaceholderImage
      : lightPlaceholderImage,
  resizeMode: "contain",
}))`
  height: 100px;
  width: 100px;
  margin: 7px;
`;

const PostOnboardingEntryPointCard: React.FC<Record<string, never>> = () => {
  const { t } = useTranslation();
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const productName = deviceModelId
    ? getDeviceModel(deviceModelId)?.productName
    : null;
  const dispatch = useDispatch();
  const openHub = useNavigateToPostOnboardingHubCallback();
  const dismissCard = useCallback(() => {
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch]);
  const visible = usePostOnboardingEntryPointVisibleOnWallet();
  if (!visible) return null;
  return (
    <Touchable onPress={openHub}>
      <Flex
        flexDirection="row"
        backgroundColor="neutral.c30" // TODO: when new wallet design is implemented, change to c20
        borderRadius={2}
      >
        <Flex flexDirection="column" mx={6} my={7} flex={1}>
          <Text
            variant="subtitle"
            fontWeight="semiBold"
            color="neutral.c70"
            mb={3}
            flexShrink={1}
          >
            {t("postOnboarding.walletCard.title")}
          </Text>
          <Text variant="body" fontWeight="medium" flexShrink={1}>
            {t("postOnboarding.walletCard.description", { productName })}
          </Text>
        </Flex>
        <PlaceholderImage />
        <Flex position="absolute" top={3} right={7}>
          <Touchable onPress={dismissCard}>
            <Flex borderRadius={20} p={2} backgroundColor="neutral.c40">
              <Icons.CloseMedium />
            </Flex>
          </Touchable>
        </Flex>
      </Flex>
    </Touchable>
  );
};

export default PostOnboardingEntryPointCard;
