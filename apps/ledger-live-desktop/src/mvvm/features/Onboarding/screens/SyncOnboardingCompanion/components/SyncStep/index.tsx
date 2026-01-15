import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { Flex, Button, Icons, Text, Link } from "@ledgerhq/react-ui";
import { SeedOriginType } from "@ledgerhq/types-live";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import { LogoWrapper } from "LLD/features/WalletSync/components/LogoWrapper";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import SkipSyncDrawer from "../SkipSyncDrawer";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setSkipDrawerVisibility } from "~/renderer/reducers/onboarding";
import { walletSyncDrawerVisibilitySelector } from "~/renderer/reducers/walletSync";
import { track, trackPage } from "~/renderer/analytics/segment";
import { analyticsFlowName } from "../../utils/constants/analytics";

interface SyncStepProps {
  handleContinue: () => void;
  isLedgerSyncActive: boolean;
  seedConfiguration?: SeedOriginType;
  deviceName: string;
}
const SyncStep = ({
  handleContinue,
  isLedgerSyncActive,
  seedConfiguration,
  deviceName,
}: SyncStepProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const isSyncDrawerOpen = useSelector(walletSyncDrawerVisibilitySelector);

  const { openDrawer: openSyncDrawer, closeDrawer } = useLedgerSyncEntryPointViewModel({
    entryPoint: EntryPoint.onboarding,
    needEligibleDevice: true,
    onboardingNewDevice: true,
  });

  const openDrawer = () => {
    track("button_clicked", {
      button: "Continue",
      flow: analyticsFlowName,
      seedConfiguration: seedConfiguration,
    });
    openSyncDrawer();
  };

  const openSkipDrawer = () => {
    track("button_clicked", {
      button: "Maybe later",
      flow: analyticsFlowName,
      seedConfiguration: seedConfiguration,
    });
    dispatch(setSkipDrawerVisibility(true));
  };

  useEffect(() => {
    if (isLedgerSyncActive && !isSyncDrawerOpen) {
      trackPage(`Set up ${deviceName}: Step 4 Ledger Sync Success`, null, {
        seedConfiguration,
        flow: analyticsFlowName,
      });
      const timer = setTimeout(handleContinue, 2000);

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [handleContinue, isLedgerSyncActive, isSyncDrawerOpen, deviceName, seedConfiguration]);

  return (
    <Flex flexDirection="column">
      <Flex flex={1} justifyContent="center" my={6}>
        <Flex justifyContent="center" alignItems="center">
          <LogoWrapper>
            <Icons.Mobile color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper opacity="100%">
            <Icons.Refresh size="L" color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper>
            <Icons.Desktop color={colors.constant.purple} />
          </LogoWrapper>
        </Flex>
      </Flex>
      <Text
        fontSize="18px"
        fontWeight="semiBold"
        textAlign="center"
        lineHeight="110%"
        style={{
          letterSpacing: "-0.54px",
        }}
      >
        {t("syncOnboarding.manual.sync.title")}
      </Text>
      <Text
        variant="bodyLineHeight"
        textAlign="center"
        mt={3}
        color="neutral.c80"
        lineHeight="20px"
        style={{
          letterSpacing: "0",
        }}
      >
        {t("syncOnboarding.manual.sync.description")}
      </Text>

      {!isLedgerSyncActive && (
        <>
          <Button variant="main" onClick={openDrawer} data-testid="onboarding-sync" mt={6}>
            {t("common.continue")}
          </Button>
          <Link onClick={openSkipDrawer} data-testid="skip-cta-button" mt={6} flex={1}>
            {t("syncOnboarding.manual.sync.skipButton")}
          </Link>
        </>
      )}

      <WalletSyncDrawer
        currentPage={AnalyticsPage.OnboardingSync}
        onClose={() => {
          closeDrawer();
        }}
      />
      <SkipSyncDrawer
        onSkip={handleContinue}
        handleSync={openDrawer}
        seedConfiguration={seedConfiguration}
        deviceName={deviceName}
      />
    </Flex>
  );
};

export default SyncStep;
