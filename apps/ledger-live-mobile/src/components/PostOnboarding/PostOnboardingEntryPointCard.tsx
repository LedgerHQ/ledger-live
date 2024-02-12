import React, { useCallback } from "react";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { useDispatch, useSelector } from "react-redux";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { hidePostOnboardingWalletEntryPoint } from "@ledgerhq/live-common/postOnboarding/actions";
import { postOnboardingDeviceModelIdSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import Touchable from "../Touchable";
import Button from "../wrappedUi/Button";

const PostOnboardingEntryPointCard: React.FC<Record<string, never>> = () => {
  const { t } = useTranslation();
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const productName = deviceModelId ? getDeviceModel(deviceModelId)?.productName : null;
  const dispatch = useDispatch();
  const openHub = useNavigateToPostOnboardingHubCallback();
  const dismissCard = useCallback(() => {
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch]);
  const visible = usePostOnboardingEntryPointVisibleOnWallet();
  if (!visible) return null;
  return (
    <Flex flexDirection="column" backgroundColor="neutral.c30" borderRadius={2} p={6}>
      <Flex flexDirection="row" justifyContent="flex-end" alignItems="center">
        <Touchable onPress={dismissCard}>
          <Flex p={2}>
            <IconsLegacy.CloseMedium size={20} />
          </Flex>
        </Touchable>
      </Flex>
      <Flex flexDirection="column" justifyContent="center">
        <Text variant="h5" fontWeight="semiBold" my={3}>
          {t("postOnboarding.entryPointCard.title", { productName })}
        </Text>
        <Text variant="paragraph" fontWeight="medium" color="neutral.c80" mb={6}>
          {t("postOnboarding.entryPointCard.description", { productName })}
        </Text>
        <Button
          alignSelf="stretch"
          type="main"
          outline
          onPress={() => openHub()}
          event="button_clicked"
          eventProperties={{ button: "Access" }}
        >
          {t("postOnboarding.entryPointCard.buttonLabel")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default PostOnboardingEntryPointCard;
