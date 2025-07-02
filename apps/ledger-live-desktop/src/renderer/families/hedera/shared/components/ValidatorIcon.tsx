import React from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";

interface Props {
  isLedger?: boolean;
  validatorName?: string;
}

const ValidatorIcon = ({ isLedger, validatorName }: Props) => {
  return (
    <IconContainer isSR>
      {isLedger ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={validatorName} />
      )}
    </IconContainer>
  );
};

export default ValidatorIcon;
