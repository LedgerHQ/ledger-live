import React from "react";
import { IconGenerator } from "@ledgerhq/live-common/families/aptos/utils";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Image from "~/renderer/components/Image";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";

const ValidatorIcon = ({
  isLedger,
  validatorAddress,
}: {
  isLedger?: boolean;
  validatorAddress?: string;
}) => {
  const icon = validatorAddress ? new IconGenerator(validatorAddress).generate() : "";

  return (
    <IconContainer isSR>
      {isLedger ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : icon ? (
        <Image resource={icon} alt="" width={32} height={32} />
      ) : (
        <FirstLetterIcon label={validatorAddress} />
      )}
    </IconContainer>
  );
};

export default ValidatorIcon;
