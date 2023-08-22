import { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import React from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import { LEDGER_POOL_IDS } from "@ledgerhq/live-common/families/cardano/utils";

const CardanoLedgerPoolIcon = ({ validator }: { validator: StakePool }) => {
  return (
    <IconContainer isSR>
      {validator && LEDGER_POOL_IDS.includes(validator.poolId) ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={validator.name || validator.ticker || validator.poolId} />
      )}
    </IconContainer>
  );
};

export default CardanoLedgerPoolIcon;
