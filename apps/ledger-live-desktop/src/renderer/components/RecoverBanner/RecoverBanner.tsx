import { Flex, ProgressLoader, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/ButtonV3";
import { useTheme } from "styled-components";
import { RecoverBannerType } from "./types";

export default function RecoverBanner() {
  const [storageData, setStorageData] = useState<string>();
  const [displayBannerData, setDisplayBannerData] = useState<boolean>();
  const [stepNumber, setStepNumber] = useState<number>(0);

  const { t } = useTranslation();
  const history = useHistory();
  const { colors } = useTheme();

  const recoverServices = useFeature("protectServicesDesktop");
  const recoverBannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "";
  const recoverUnfinishedOnboardingPath = useCustomPath(
    recoverServices,
    "activate",
    "lld-banner-unfinished-onboarding",
    "recover-launch",
  );

  const maxStepNumber = 5;

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
        recoverBannerWording = t("dashboard.recoverBanner.subscribeDone", { returnObjects: true });
        break;
      case "BACKUP_VERIFY_IDENTITY":
        setStepNumber(3);
        recoverBannerWording = t("dashboard.recoverBanner.verifyIdentity", { returnObjects: true });
        break;
      case "BACKUP_DEVICE_CONNECTION":
        setStepNumber(4);
        recoverBannerWording = t("dashboard.recoverBanner.connectDevice", { returnObjects: true });
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
    if (recoverUnfinishedOnboardingPath) history.push(recoverUnfinishedOnboardingPath);
  };

  const onCloseBanner = () => {
    setStoreValue("DISPLAY_BANNER", "false", protectID);
    setDisplayBannerData(false);
  };

  useEffect(() => {
    getStorageSubscriptionState();
  }, [getStorageSubscriptionState]);

  if (!recoverBannerIsEnabled || !recoverBannerSelected || !displayBannerData) return null;

  return (
    <Flex justifyContent="center" mb={20}>
      <Flex
        position="relative"
        columnGap={12}
        bg={colors.opacityPurple.c10}
        justifyContent="space-between"
        alignItems="center"
        borderRadius="8px"
        overflow="hidden"
        width="100%"
      >
        <Flex alignItems="center" justifyContent="center" ml={3} width={40}>
          <ProgressLoader
            progress={(stepNumber * 100) / maxStepNumber}
            radius={20}
            stroke={4}
            showPercentage={false}
          />
          <Text
            display="block"
            flex={1}
            textAlign="center"
            fontSize="12px"
            lineHeight="15px"
            fontWeight="medium"
          >
            {`${stepNumber}/${maxStepNumber - 1}`}
          </Text>
        </Flex>
        <Flex flex={1} flexDirection="column" py={3} overflow="hidden">
          <Text
            fontWeight="semiBold"
            fontSize="13px"
            lineHeight="16px"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            width="100%"
            overflow="hidden"
          >
            {recoverBannerSelected.title}
          </Text>
          <Text
            mt={1}
            fontSize="12px"
            lineHeight="15px"
            fontWeight="medium"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            width="100%"
            overflow="hidden"
            color="pallette.neutral.c80"
          >
            {recoverBannerSelected.description}
          </Text>
        </Flex>
        <Flex alignItems="center" p={3} pl={0} columnGap={3}>
          <Button outline={false} onClick={onCloseBanner}>
            {recoverBannerSelected.secondaryCta}
          </Button>
          <Button variant="main" outline={false} onClick={onRedirectRecover}>
            {recoverBannerSelected.primaryCta}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
