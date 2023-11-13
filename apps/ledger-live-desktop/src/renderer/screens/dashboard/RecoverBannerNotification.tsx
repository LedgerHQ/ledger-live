import { Box, Flex, Icon, Link, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import Image from "~/renderer/components/Image";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { RecoverBanner } from "@ledgerhq/types-live";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";

export default function RecoverBannerNotification() {
  const [storageData, setStorageData] = useState<string>();
  const [displayBannerData, setDisplayBannerData] = useState<boolean>();
  const history = useHistory();
  const recoverService = useFeature("protectServicesDesktop");
  const recoverUnfinishedOnboardingPath = useCustomPath(
    recoverService,
    "activate",
    "lld-banner-unfinished-onboarding",
    "recover-launch",
  );
  const protectID = recoverService?.params?.protectId ?? "";

  const getStorageSubscriptionState = useCallback(async () => {
    const storage = await getStoreValue("SUBSCRIPTION_STATE", protectID);
    const displayBanner = await getStoreValue("DISPLAY_BANNER", protectID);
    setStorageData(storage as string);
    setDisplayBannerData(displayBanner === "true");
  }, [protectID]);

  const recoverBannerSelected: RecoverBanner | undefined = useMemo(() => {
    const recoverBannerDatas: RecoverBanner[] = recoverService?.params?.recoverBanner ?? [];

    switch (storageData) {
      case "NO_SUBSCRIPTION":
        return undefined;
      case "STARGATE_SUBSCRIBE":
        return recoverBannerDatas.find(item => item.key === "subscription_done");
      case "BACKUP_VERIFY_IDENTITY":
        return recoverBannerDatas.find(item => item.key === "subscription_done");
      case "BACKUP_DEVICE_CONNECTION":
        return recoverBannerDatas.find(item => item.key === "subscription_done");
      case "BACKUP_DONE":
        return undefined;
      default:
        return undefined;
    }
  }, [recoverService?.params?.recoverBanner, storageData]);

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

  if (!recoverBannerSelected || !displayBannerData) return null;

  return (
    <Flex justifyContent="center">
      <Flex
        position="relative"
        columnGap={3}
        bg="palette.background.paper"
        justifyContent="space-between"
        mb={40}
        borderRadius={10}
        overflow="hidden"
        maxWidth="700px"
        width="100%"
      >
        <Flex flexDirection="column" p={3}>
          <Text color="text.shade100" ff="Inter|Light" uppercase>
            {recoverBannerSelected?.title}
          </Text>
          <Text flex={1} mt={1} whiteSpace="pre-wrap" variant="small">
            {recoverBannerSelected.description}
          </Text>
          <Box>
            <Link
              size="small"
              type="color"
              color="primary.c80"
              mr={8}
              onClick={() => onRedirectRecover()}
              iconPosition="right"
              Icon={() => <Icon name="ArrowRight" />}
            >
              {recoverBannerSelected.linkContent}
            </Link>
          </Box>
        </Flex>
        <Box height="150px">
          <Image
            resource={recoverBannerSelected.image}
            alt={recoverBannerSelected.title}
            width="auto"
            style={{
              objectFit: "cover",
              height: "100%",
            }}
          />
        </Box>
        <Box
          position="absolute"
          top={0}
          right={0}
          pt="5px"
          pr="6px"
          onClick={() => onCloseBanner()}
          style={{
            cursor: "pointer",
          }}
        >
          <Icon name="Close" />
        </Box>
      </Flex>
    </Flex>
  );
}
