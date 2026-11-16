import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import React from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import { useCosmosLedgerValidatorIds } from "~/renderer/families/cosmos/shared/hooks/useCosmosNetworkValidators";

const CosmosFamilyLedgerValidatorIcon = ({
  currency,
  validator,
}: {
  currency: CryptoCurrency;
  validator?: Partial<CosmosValidatorItem> | null;
}) => {
  const ledgerValidatorIds = useCosmosLedgerValidatorIds(currency);
  const address = validator?.validatorAddress;
  return (
    <IconContainer isSR>
      {address && ledgerValidatorIds.includes(address) ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={validator?.name || address} />
      )}
    </IconContainer>
  );
};
export default CosmosFamilyLedgerValidatorIcon;
