import React from "react";
import { SeeAllAssetsButton } from "LLM/features/WalletAssets/components/SeeAllAssetsButton";
import { CryptoAddressesButton } from "LLM/features/WalletAssets/components/CryptoAddressesButton";
import { usePortfolioButtonSectionViewModel } from "./usePortfolioButtonSectionViewModel";

interface PortfolioButtonSectionProps {
  hasMore: boolean;
  onPressShowAll: () => void;
}

export const PortfolioButtonSection: React.FC<PortfolioButtonSectionProps> = ({
  hasMore,
  onPressShowAll,
}) => {
  const { isAssetSectionEnabled } = usePortfolioButtonSectionViewModel();
  if (isAssetSectionEnabled) return <CryptoAddressesButton />;
  return <SeeAllAssetsButton hasMore={hasMore} onPress={onPressShowAll} />;
};
