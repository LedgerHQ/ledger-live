import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { Flex, Button, Text } from "@ledgerhq/react-ui";
import { SeedOriginType } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import {
  onboardingSyncSkipDrawerVisibilitySelector,
  setSkipDrawerVisibility,
} from "~/renderer/reducers/onboarding";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName } from "../../utils/constants/analytics";
import { track, trackPage } from "~/renderer/analytics/segment";

interface SkipSyncDrawerProps {
  onSkip: () => void;
  handleSync: () => void;
  seedConfiguration?: SeedOriginType;
  deviceName: string;
}

const SkipSyncDrawer: React.FC<SkipSyncDrawerProps> = ({
  onSkip,
  handleSync,
  seedConfiguration,
  deviceName,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const isOpen = useSelector(onboardingSyncSkipDrawerVisibilitySelector);

  const closeDrawer = () => dispatch(setSkipDrawerVisibility(false));
  const handleSkipCTA = () => {
    track("button_clicked", {
      button: "Yes, skip",
      flow: analyticsFlowName,
      seedConfiguration: seedConfiguration,
    });
    trackPage(`Set up ${deviceName}: Step 4 Ledger Sync Reject`, null, {
      seedConfiguration,
      flow: analyticsFlowName,
    });
    closeDrawer();
    onSkip();
  };

  const handleSyncCTA = () => {
    track("button_clicked", {
      button: "Enable sync",
      flow: analyticsFlowName,
      seedConfiguration: seedConfiguration,
    });

    closeDrawer();
    handleSync();
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      direction="left"
      forceDisableFocusTrap
      style={{
        background: colors.background.card,
      }}
    >
      <TrackPage
        category={"Drawer: Skip Ledger sync confirmation"}
        flow={analyticsFlowName}
        seedConfiguration={seedConfiguration}
      />
      <Flex
        flex={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        rowGap="24px"
        paddingX="73px"
        data-testid="skip-sync-drawer"
      >
        <Flex flexDirection="column" rowGap="16px">
          <Text
            textAlign="center"
            style={{
              letterSpacing: "-0.72px",
            }}
            fontSize={8}
            fontWeight="semiBold"
            lineHeight="135%"
            color="neutral.c100"
          >
            {t("syncOnboarding.manual.sync.skipTitle")}
          </Text>
          <Text textAlign="center" variant="body" lineHeight="150%" color="neutral.c70">
            {t("syncOnboarding.manual.sync.skipDescription")}
          </Text>
        </Flex>
        <Flex flexDirection="column" rowGap="16px" alignSelf="stretch">
          <Button
            variant="main"
            onClick={handleSkipCTA}
            data-testid="onboarding-sync-skip-confirmSkip"
          >
            {t("syncOnboarding.manual.sync.skipConfirm")}
          </Button>
          <Button variant="shade" onClick={handleSyncCTA} data-testid="onboarding-sync-skip-doSync">
            {t("syncOnboarding.manual.sync.skipNo")}
          </Button>
        </Flex>
      </Flex>
    </SideDrawer>
  );
};

export default SkipSyncDrawer;
