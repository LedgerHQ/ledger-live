import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PortfolioAssets from "~/screens/Portfolio/PortfolioAssets";
import AnimatedContainer from "~/screens/Portfolio/AnimatedContainer";

interface PortfolioAssetsSectionProps {
  readonly isAccountListUIEnabled: boolean;
  readonly hideEmptyTokenAccount: boolean;
  readonly openAddModal: () => void;
  readonly onHeightChange: (height: number) => void;
  readonly shouldAddBottomPadding?: boolean;
}

export const PortfolioAssetsSection = ({
  isAccountListUIEnabled,
  hideEmptyTokenAccount,
  openAddModal,
  onHeightChange,
  shouldAddBottomPadding = false,
}: PortfolioAssetsSectionProps) => {
  const { bottom } = useSafeAreaInsets();

  const content = (
    <Box
      px={6}
      key="PortfolioAssets"
      style={shouldAddBottomPadding ? { paddingBottom: bottom + 16 } : undefined}
    >
      <PortfolioAssets hideEmptyTokenAccount={hideEmptyTokenAccount} openAddModal={openAddModal} />
    </Box>
  );

  if (isAccountListUIEnabled) {
    return <AnimatedContainer onHeightChange={onHeightChange}>{content}</AnimatedContainer>;
  }

  return content;
};
