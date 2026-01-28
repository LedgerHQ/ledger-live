import React from "react";
import { Box, Flex } from "@ledgerhq/native-ui";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import PortfolioQuickActionsBar from "~/screens/Portfolio/PortfolioQuickActionsBar";
import { View } from "react-native";

interface PortfolioHeaderSectionProps {
  readonly showAssets: boolean;
  readonly hideGraph: boolean;
  readonly onBackFromUpdate: () => void;
  readonly isReadOnlyMode?: boolean;
}

export const PortfolioHeaderSection = ({
  showAssets,
  hideGraph,
  onBackFromUpdate,
  isReadOnlyMode = false,
}: PortfolioHeaderSectionProps) => {
  return (
    <View key="portfolioHeaderElements" style={{ paddingTop: 24 }}>
      <Flex px={6} key="FirmwareUpdateBanner">
        <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
      </Flex>
      <PortfolioGraphCard
        key="PortfolioGraphCard"
        showAssets={showAssets}
        screenName="Wallet"
        hideGraph={hideGraph}
        isReadOnlyMode={isReadOnlyMode}
      />
      {showAssets && (
        <Box my={24} px={6}>
          <PortfolioQuickActionsBar />
        </Box>
      )}
    </View>
  );
};
