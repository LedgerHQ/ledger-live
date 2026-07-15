import React, { useCallback } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import { PortfolioBalanceSection } from "../PortfolioBalanceSection";
import { PortfolioRefreshStatus } from "../PortfolioRefreshStatus";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import { usePortfolioHeaderSectionViewModel } from "./usePortfolioHeaderSectionViewModel";

interface PortfolioHeaderSectionProps {
  readonly showAssets: boolean;
  readonly onBackFromUpdate: () => void;
  readonly isReadOnlyMode?: boolean;
  readonly ctas?: React.ReactNode;
}

export const PortfolioHeaderSection = ({
  showAssets,
  onBackFromUpdate,
  isReadOnlyMode = false,
  ctas,
}: PortfolioHeaderSectionProps) => {
  const { safeAreaTop, onBannerHeightChange, minContentHeight, bannerTopInset } =
    usePortfolioHeaderSectionViewModel();

  const onBannerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onBannerHeightChange(e.nativeEvent.layout.height);
    },
    [onBannerHeightChange],
  );

  return (
    <View key="portfolioHeaderElements" style={{ paddingTop: safeAreaTop }}>
      <PortfolioRefreshStatus />
      <View key="FirmwareUpdateBanner" style={{ marginTop: bannerTopInset }}>
        <Box onLayout={onBannerLayout} lx={{ paddingHorizontal: "s16" }}>
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Box>
      </View>
      <ScreenHeroSectionView ctas={ctas} minContentHeight={minContentHeight}>
        <PortfolioBalanceSection showAssets={showAssets} isReadOnlyMode={isReadOnlyMode} />
      </ScreenHeroSectionView>
    </View>
  );
};
