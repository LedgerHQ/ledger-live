import React from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { SeeAllAssetsButton } from "LLM/features/WalletAssets/components/SeeAllAssetsButton";
import { CryptoAddressesButton } from "LLM/features/WalletAssets/components/CryptoAddressesButton";

interface PortfolioButtonSectionProps {
  hasMore: boolean;
  onPressShowAll: () => void;
}

export const PortfolioButtonSection: React.FC<PortfolioButtonSectionProps> = ({
  hasMore,
  onPressShowAll,
}) => {
  const lwmWallet40 = useFeature("lwmWallet40");
  const isAssetSectionEnabled = lwmWallet40?.enabled && lwmWallet40?.params?.assetSection;
  if (isAssetSectionEnabled) return <CryptoAddressesButton />;
  return <SeeAllAssetsButton hasMore={hasMore} onPress={onPressShowAll} />;
};
