import React, { useCallback } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import { PortfolioBalanceSection } from "../PortfolioBalanceSection";
import { PortfolioRefreshStatus } from "../PortfolioRefreshStatus";
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
  const { safeAreaTop, shouldDisplayBalanceRefreshRework, onBannerHeightChange, minContentHeight } =
    usePortfolioHeaderSectionViewModel();

  const onBannerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onBannerHeightChange(e.nativeEvent.layout.height);
    },
    [onBannerHeightChange],
  );

  if (hideGraph) {
    return (
      <View key="portfolioHeaderElements" style={{ paddingTop: safeAreaTop }}>
        {shouldDisplayBalanceRefreshRework && <PortfolioRefreshStatus />}
        <View onLayout={onBannerLayout}>
          <Flex px={6} key="FirmwareUpdateBanner">
            <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
          </Flex>
        </View>
        <ScreenHeroSectionView ctas={ctas} minContentHeight={minContentHeight}>
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
