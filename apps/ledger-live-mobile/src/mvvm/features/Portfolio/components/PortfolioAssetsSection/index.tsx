import React from "react";
import { Box } from "@ledgerhq/native-ui";
import RecoverBanner from "~/components/RecoverBanner";
import PortfolioAssets from "~/screens/Portfolio/PortfolioAssets";
import AnimatedContainer from "~/screens/Portfolio/AnimatedContainer";

interface PortfolioAssetsSectionProps {
  readonly isAccountListUIEnabled: boolean;
  readonly hideEmptyTokenAccount: boolean;
  readonly openAddModal: () => void;
  readonly onHeightChange: (height: number) => void;
}

export const PortfolioAssetsSection = ({
  isAccountListUIEnabled,
  hideEmptyTokenAccount,
  openAddModal,
  onHeightChange,
}: PortfolioAssetsSectionProps) => {
  if (isAccountListUIEnabled) {
    return (
      <AnimatedContainer onHeightChange={onHeightChange}>
        <Box px={6} key="PortfolioAssets">
          <RecoverBanner />
          <PortfolioAssets
            hideEmptyTokenAccount={hideEmptyTokenAccount}
            openAddModal={openAddModal}
          />
        </Box>
      </AnimatedContainer>
    );
  }

  return (
    <Box px={6} key="PortfolioAssets">
      <RecoverBanner />
      <PortfolioAssets hideEmptyTokenAccount={hideEmptyTokenAccount} openAddModal={openAddModal} />
    </Box>
  );
};
