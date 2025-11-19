import React from "react";
import { Box } from "@ledgerhq/react-ui";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountSelection } from "~/newArch/features/ModularDrawer/screens/AccountSelection";
import { MODULAR_DRAWER_STEP } from "~/newArch/features/ModularDrawer/types";
import { Title } from "~/newArch/features/ModularDrawer/components/Title";
import { BackButtonArrow } from "~/newArch/features/ModularDrawer/components/BackButton";
import { CloseButton } from "~/newArch/features/ModularDrawer/components/CloseButton";

type Props = Readonly<{
  asset: CryptoOrTokenCurrency;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  onClose?: () => void;
  onBack: () => void;
}>;

const SelectAccountStep = ({ asset, onAccountSelected, onClose, onBack }: Props) => {
  return (
    <Box height={612} display="flex" flexDirection="column" px={4} py={4} position="relative">
      <BackButtonArrow onBackClick={onBack} />
      <CloseButton onRequestClose={() => onClose?.()} />
      <Box mt={6}>
        <Title step={MODULAR_DRAWER_STEP.ACCOUNT_SELECTION} />
      </Box>
      <AccountSelection asset={asset} onAccountSelected={onAccountSelected} />
    </Box>
  );
};

export default SelectAccountStep;
