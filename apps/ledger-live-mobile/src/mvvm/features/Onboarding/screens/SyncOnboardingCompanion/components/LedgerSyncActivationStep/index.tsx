import React from "react";
import { Button, Flex, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import IconsHeader from "LLM/features/WalletSync/components/Activation/IconsHeader";
import SkipLedgerSyncDrawer from "./SkipLedgerSyncDrawer";
import {
  useLedgerSyncActivationStepViewModel,
  type LedgerSyncActivationStepViewProps,
} from "./useLedgerSyncActivationStepViewModel";
import type { LedgerSyncActivationStepProps } from "./types";

const { BodyText } = VerticalTimeline;

const View = ({
  isLedgerSyncActive,
  isDrawerOpen,
  analyticsSeedConfiguration,
  handleSyncContinue,
  handleSkipCTA,
  handleDrawerClose,
  handleSyncOpenFromDrawer,
  handleSkip,
}: LedgerSyncActivationStepViewProps) => {
  const { t } = useTranslation();

  return (
    <>
      <TrackScreen
        category="Set up device: Step 4 Ledger Sync"
        flow="onboarding"
        seedConfiguration={analyticsSeedConfiguration.current}
      />
      <Flex justifyContent="center">
        <IconsHeader />
        <Flex mt={3} alignItems="center" justifyContent="center">
          <Text variant="h5" fontWeight="semiBold">
            {t("syncOnboarding.syncStep.descriptionTitle")}
          </Text>
          <BodyText variant="body" textAlign="center">
            {t("syncOnboarding.syncStep.description")}
          </BodyText>
        </Flex>
        {!isLedgerSyncActive && (
          <Button mb={3} mt={4} size="small" type="main" onPress={handleSyncContinue}>
            {t("common.continue")}
          </Button>
        )}
        {!isLedgerSyncActive && (
          <Button size="small" onPress={handleSkipCTA}>
            {t("syncOnboarding.syncStep.skipCta")}
          </Button>
        )}
      </Flex>
      <SkipLedgerSyncDrawer
        isOpen={isDrawerOpen}
        handleClose={handleDrawerClose}
        openSync={handleSyncOpenFromDrawer}
        skipSync={handleSkip}
        seedConfiguration={analyticsSeedConfiguration}
      />
    </>
  );
};

const LedgerSyncActivationStep: React.FC<LedgerSyncActivationStepProps> = props => (
  <View {...useLedgerSyncActivationStepViewModel(props)} />
);

export default LedgerSyncActivationStep;
