import React from "react";
import { Box } from "@ledgerhq/react-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import AssetSelection from "~/newArch/features/ModularDrawer/screens/AssetSelection";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { MODULAR_DRAWER_STEP } from "~/newArch/features/ModularDrawer/types";
import { Title } from "~/newArch/features/ModularDrawer/components/Title";
import { BackButtonArrow } from "~/newArch/features/ModularDrawer/components/BackButton";
import { CloseButton } from "~/newArch/features/ModularDrawer/components/CloseButton";

type Props = Readonly<{
  assetsToDisplay: CryptoOrTokenCurrency[];
  loadingStatus: LoadingStatus;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  assetsSorted?: AssetData[];
  loadNext?: () => void;
  error?: boolean;
  refetch?: () => void;
  onClose?: () => void;
  onBack?: () => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
}>;

const SelectAssetStep = ({
  assetsToDisplay,
  loadingStatus,
  assetsConfiguration,
  assetsSorted,
  loadNext,
  error,
  refetch,
  onClose,
  onBack,
  onAssetSelected,
}: Props) => {
  return (
    <Box height={612} display="flex" flexDirection="column" px={4} py={4} position="relative">
      <BackButtonArrow onBackClick={onBack} />
      <CloseButton onRequestClose={() => onClose?.()} />
      <Box mt={6}>
        <Title step={MODULAR_DRAWER_STEP.ASSET_SELECTION} />
      </Box>
      <AssetSelection
        assetsToDisplay={assetsToDisplay}
        providersLoadingStatus={loadingStatus}
        assetsConfiguration={assetsConfiguration}
        onAssetSelected={onAssetSelected}
        loadNext={loadNext}
        error={!!error}
        refetch={refetch}
        assetsSorted={assetsSorted}
      />
    </Box>
  );
};

export default SelectAssetStep;
