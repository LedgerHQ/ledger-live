// @flow
import type { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";

import React from "react";
import { COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES } from "@ledgerhq/live-common/families/cosmos/utils";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";

const CosmosFamilyLedgerValidatorIcon = ({ validator }: { validator: CosmosValidatorItem }) => {
  return (
    <IconContainer isSR>
      {validator &&
      COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.includes(validator.validatorAddress) ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={validator.name || validator.validatorAddress} />
      )}
    </IconContainer>
  );
};

export default CosmosFamilyLedgerValidatorIcon;
