import React from "react";
import { Box, Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { DesyncOverlay } from "./components/DesyncOverlay";
import TwoStepCompanion from "./components/TwoStepCompanion";

import useSyncOnboardingCompanionViewModel, {
  SyncOnboardingCompanionProps,
} from "./useSyncOnboardingCompanionViewModel";

const View = ({
  isDesyncOverlayOpen,
  desyncOverlayDelay,
  productName,
  isSyncIncr1Enabled,
  deviceName,
  steps,
  stepKey,
  companionSteps,
  isNewSeed,
  analyticsSeedConfiguration,
}: ReturnType<typeof useSyncOnboardingCompanionViewModel>) => {
  const { t } = useTranslation();

  return (
    <Flex width="100%" height="100%" flexDirection="column" justifyContent="flex-start">
      <DesyncOverlay
        isOpen={isDesyncOverlayOpen}
        delay={desyncOverlayDelay}
        productName={productName}
      />
      <Flex
        height="100%"
        width="480px"
        flexDirection="column"
        justifyContent="flex-start"
        alignSelf="center"
        flexGrow={0}
        flexShrink={1}
      >
        <Text variant="h3Inter" fontSize="8" fontWeight="semiBold" mb="8">
          {isSyncIncr1Enabled
            ? t("syncOnboarding.manual.titleTwoStep")
            : t("syncOnboarding.manual.title", { deviceName })}
        </Text>
        <Box>
          {isSyncIncr1Enabled ? (
            <TwoStepCompanion
              deviceName={deviceName}
              steps={steps}
              activeStepKey={stepKey}
              installStep={companionSteps.installStep}
              isNewSeed={isNewSeed}
              handleComplete={companionSteps.handleAppStepComplete}
              seedConfiguration={analyticsSeedConfiguration.current}
              hasSyncStep={companionSteps.hasSyncStep}
            />
          ) : (
            <VerticalTimeline steps={steps} />
          )}
        </Box>
      </Flex>
    </Flex>
  );
};

/**
 * Component rendering the synchronous onboarding companion
 */
const SyncOnboardingCompanion: React.FC<SyncOnboardingCompanionProps> = props => (
  <View {...useSyncOnboardingCompanionViewModel(props)} />
);

export default SyncOnboardingCompanion;
