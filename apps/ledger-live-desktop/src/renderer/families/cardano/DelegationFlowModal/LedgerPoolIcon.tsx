import { getLedgerPoolIds, StakePool } from "@ledgerhq/live-common/families/cardano/staking";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import React from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";

type Props = { validator: StakePool; currency: CryptoCurrency };

const CardanoLedgerPoolIcon = ({ validator, currency }: Props) => {
  return (
    <IconContainer isSR>
      {validator && getLedgerPoolIds(currency).includes(validator.poolId) ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={validator.name || validator.ticker || validator.poolId} />
      )}
    </IconContainer>
  );
};

export default CardanoLedgerPoolIcon;
