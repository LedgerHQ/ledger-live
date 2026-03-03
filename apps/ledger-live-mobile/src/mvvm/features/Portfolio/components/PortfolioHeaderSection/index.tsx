import React from "react";
import { View } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import { PortfolioBalanceSection } from "../PortfolioBalanceSection";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import { usePortfolioHeaderSectionViewModel } from "./usePortfolioHeaderSectionViewModel";

interface PortfolioHeaderSectionProps {
  readonly showAssets: boolean;
  readonly hideGraph: boolean;
  readonly onBackFromUpdate: () => void;
  readonly isReadOnlyMode?: boolean;
  readonly ctas?: React.ReactNode;
}

export const PortfolioHeaderSection = ({
  showAssets,
  hideGraph,
  onBackFromUpdate,
  isReadOnlyMode = false,
  ctas,
}: PortfolioHeaderSectionProps) => {
  const { safeAreaTop } = usePortfolioHeaderSectionViewModel();

  if (hideGraph) {
    return (
      <View key="portfolioHeaderElements" style={{ paddingTop: safeAreaTop }}>
        <Flex px={6} key="FirmwareUpdateBanner">
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
        <ScreenHeroSectionView ctas={ctas}>
          <PortfolioBalanceSection showAssets={showAssets} isReadOnlyMode={isReadOnlyMode} />
        </ScreenHeroSectionView>
      </View>
    );
  }

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
    </View>
  );
};
