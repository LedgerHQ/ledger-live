import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Flex, Icon, ProgressLoader, Text } from "@ledgerhq/native-ui";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCustomURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useTheme } from "styled-components/native";
import { RecoverBannerType } from "./types";
import { GestureResponderEvent, Linking } from "react-native";
import { getStoreValue, setStoreValue } from "~/store";

function RecoverBanner() {
  const [storageData, setStorageData] = useState<string>();
  const [displayBannerData, setDisplayBannerData] = useState<boolean>();
  const [stepNumber, setStepNumber] = useState<number>(0);

  const { t } = useTranslation();
  const { colors } = useTheme();
  const recoverServices = useFeature("protectServicesMobile");

  const bannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "";
  const maxStepNumber = 5;

  const recoverUnfinishedOnboardingPath = useCustomURI(
    recoverServices,
    "activate",
    "llm-banner-unfinished-onboarding",
    "recover-launch",
  );

  const getStorageSubscriptionState = useCallback(async () => {
    const storage = await getStoreValue("SUBSCRIPTION_STATE", protectID);
    const displayBanner = await getStoreValue("DISPLAY_BANNER", protectID);
    setStorageData(storage as string);
    setDisplayBannerData(displayBanner === "true");
  }, [protectID]);

  const recoverBannerSelected: RecoverBannerType | undefined = useMemo(() => {
    let recoverBannerWording: RecoverBannerType;

    switch (storageData) {
      case "NO_SUBSCRIPTION":
        setStepNumber(1);
        return undefined;
      case "STARGATE_SUBSCRIBE":
        setStepNumber(2);
        recoverBannerWording = t("portfolio.recoverBanner.subscribeDone", { returnObjects: true });
        break;
      case "BACKUP_VERIFY_IDENTITY":
        setStepNumber(3);
        recoverBannerWording = t("portfolio.recoverBanner.verifyIdentity", { returnObjects: true });
        break;
      case "BACKUP_DEVICE_CONNECTION":
        setStepNumber(4);
        recoverBannerWording = t("portfolio.recoverBanner.connectDevice", { returnObjects: true });
        break;
      case "BACKUP_DONE":
        setStepNumber(5);
        return undefined;
      default:
        setStepNumber(0);
        return undefined;
    }

    return recoverBannerWording;
  }, [storageData, t]);

  const onRedirectRecover = () => {
    if (recoverUnfinishedOnboardingPath)
      Linking.canOpenURL(recoverUnfinishedOnboardingPath).then(() =>
        Linking.openURL(recoverUnfinishedOnboardingPath),
      );
  };

  const onCloseBanner = (event: GestureResponderEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setStoreValue("DISPLAY_BANNER", "false", protectID);
    setDisplayBannerData(false);
  };

  useEffect(() => {
    getStorageSubscriptionState();
  }, [getStorageSubscriptionState]);

  if (!bannerIsEnabled || !recoverBannerSelected || !displayBannerData) return null;

  return (
    <Flex justifyContent="center" position="relative">
      <Flex
        position="relative"
        columnGap={12}
        bg={colors.opacityDefault.c05}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        borderRadius={12}
        overflow="hidden"
        width="100%"
        onTouchEnd={onRedirectRecover}
        p={4}
      >
        <Flex alignItems="center" justifyContent="center" width={40}>
          <ProgressLoader progress={stepNumber / maxStepNumber} radius={20}>
            <Text display="block" flex={1} textAlign="center" fontSize={2}>
              {`${stepNumber}/${maxStepNumber - 1}`}
            </Text>
          </ProgressLoader>
        </Flex>
        <Flex flex={1} flexDirection="column" overflow="hidden">
          <Text variant="body" fontWeight="bold" width="100%" overflow="hidden">
            {recoverBannerSelected.title}
          </Text>
          <Text
            variant="paragraph"
            fontWeight="medium"
            width="100%"
            overflow="hidden"
            color={colors.neutral.c80}
            numberOfLines={1}
            pb={1}
          >
            {recoverBannerSelected.description}
          </Text>
        </Flex>
        <Flex
          position="absolute"
          top={-5}
          right={-5}
          height={40}
          width={40}
          p={3}
          alignItems="center"
          justifyContent="center"
          onTouchEnd={onCloseBanner}
          borderRadius={40}
        >
          <Icon name="Close" size={16} color={colors.neutral.c100} />
        </Flex>
      </Flex>
    </Flex>
  );
}

export default memo(RecoverBanner);
