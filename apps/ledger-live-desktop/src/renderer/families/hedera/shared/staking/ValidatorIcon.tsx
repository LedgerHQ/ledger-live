import React from "react";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";

interface Props {
  validator?: HederaValidator;
}

const ValidatorIcon = ({ validator }: Props) => {
  const isLedger = validator?.isLedgerNode ?? false;
  const validatorName = validator?.name ?? "";

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
