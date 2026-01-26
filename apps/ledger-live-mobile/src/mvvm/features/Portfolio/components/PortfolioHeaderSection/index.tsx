import React from "react";
import { Box, Flex } from "@ledgerhq/native-ui";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import PortfolioQuickActionsBar from "~/screens/Portfolio/PortfolioQuickActionsBar";

interface PortfolioHeaderSectionProps {
  readonly showAssets: boolean;
  readonly hideGraph: boolean;
  readonly onBackFromUpdate: () => void;
}

export const PortfolioHeaderSection = ({
  showAssets,
  hideGraph,
  onBackFromUpdate,
}: PortfolioHeaderSectionProps) => {
  return (
    <WalletTabSafeAreaView key="portfolioHeaderElements" edges={["left", "right"]}>
      <Flex px={6} key="FirmwareUpdateBanner">
        <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
      </Flex>
      <PortfolioGraphCard
        showAssets={showAssets}
        screenName="Wallet"
        key="PortfolioGraphCard"
        hideGraph={hideGraph}
      />
      {showAssets && (
        <Box my={24} px={6}>
          <PortfolioQuickActionsBar />
        </Box>
      )}
    </WalletTabSafeAreaView>
  );
};
