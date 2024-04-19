import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import {
  useAllPostOnboardingActionsCompleted,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingHubContent from "~/renderer/components/PostOnboardingHub/PostOnboardingHubContent";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import TrackPage from "~/renderer/analytics/TrackPage";

const PostOnboardingScreen = () => {
  const { t } = useTranslation();
  const areAllPostOnboardingActionsCompleted = useAllPostOnboardingActionsCompleted();

  const { deviceModelId } = usePostOnboardingHubState();

  return (
    <Flex
      flexDirection="row"
      width="100%"
      height="100%"
      data-test-id="post-onboarding-hub-container"
    >
      <Flex
        justifyContent="center"
        flex={1}
        flexDirection="column"
        paddingLeft={100}
        paddingRight={50}
      >
        <TrackPage
          category={
            areAllPostOnboardingActionsCompleted
              ? "User has completed all post-onboarding actions"
              : "Post-onboarding hub"
          }
          flow={"post-onboarding"}
          deviceModelId={deviceModelId}
        />

        <Text
          variant="paragraph"
          fontSize={40}
          mb={8}
          fontWeight="semiBold"
          lineHeight="120%"
          whiteSpace="pre-wrap"
        >
          {areAllPostOnboardingActionsCompleted
            ? t("postOnboarding.postOnboardingScreen.titleCompleted")
            : t("postOnboarding.postOnboardingScreen.title", {
                productName: getDeviceModel(deviceModelId ?? DeviceModelId.stax).productName,
              })}
        </Text>
      </Flex>
      <Flex flex={1} paddingRight={100} paddingLeft={50}>
        <PostOnboardingHubContent />
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingScreen);
