import React from "react";
import { Box } from "@ledgerhq/react-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DRAWER_STEP } from "~/newArch/features/ModularDrawer/types";
import { Title } from "~/newArch/features/ModularDrawer/components/Title";
import { BackButtonArrow } from "~/newArch/features/ModularDrawer/components/BackButton";
import { CloseButton } from "~/newArch/features/ModularDrawer/components/CloseButton";
import { NetworkSelection } from "~/newArch/features/ModularDrawer/screens/NetworkSelection";

type Props = Readonly<{
  networks: CryptoOrTokenCurrency[];
  networksConfiguration: EnhancedModularDrawerConfiguration["networks"];
  selectedAssetId: string;
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  onClose?: () => void;
  onBack: () => void;
}>;

const SelectNetworkStep = ({
  networks,
  networksConfiguration,
  selectedAssetId,
  onNetworkSelected,
  onClose,
  onBack,
}: Props) => {
  return (
    <Box height={612} display="flex" flexDirection="column" px={4} py={4} position="relative">
      <BackButtonArrow onBackClick={onBack} />
      <CloseButton onRequestClose={() => onClose?.()} />
      <Box mt={6}>
        <Title step={MODULAR_DRAWER_STEP.NETWORK_SELECTION} />
      </Box>
      <NetworkSelection
        networks={networks}
        networksConfiguration={networksConfiguration}
        onNetworkSelected={onNetworkSelected}
        selectedAssetId={selectedAssetId}
      />
    </Box>
  );
};

export default SelectNetworkStep;
