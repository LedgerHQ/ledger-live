// @flow
import type { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";

import React from "react";
import { LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/cosmos/utils";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";

const CosmosLedgerValidatorIcon = ({ validator }: { validator: StakePool }) => {
  return (
    <IconContainer isSR>
      {validator &&
      validator.poolId === "7df262feae9201d1b2e32d4c825ca91b29fbafb2b8e556f6efb7f549" ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={validator.name || validator.ticker || validator.poolId} />
      )}
    </IconContainer>
  );
};

export default CosmosLedgerValidatorIcon;
