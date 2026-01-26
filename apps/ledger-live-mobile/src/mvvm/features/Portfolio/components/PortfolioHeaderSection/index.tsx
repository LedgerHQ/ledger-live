import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";

interface PortfolioHeaderSectionProps {
  readonly showAssets: boolean;
  readonly hideGraph: boolean;
  readonly isLNSUpsellBannerShown: boolean;
  readonly onBackFromUpdate: () => void;
}

export const PortfolioHeaderSection = ({
  showAssets,
  hideGraph,
  isLNSUpsellBannerShown,
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
      {isLNSUpsellBannerShown && <LNSUpsellBanner location="wallet" mx={6} mt={7} />}
      {!isLNSUpsellBannerShown && showAssets ? (
        <ContentCardsLocation
          key="contentCardsLocationPortfolio"
          locationId={ContentCardLocation.TopWallet}
          mt="20px"
        />
      ) : null}
    </WalletTabSafeAreaView>
  );
};
