import React from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Image from "~/renderer/components/Image";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";

const ValidatorIcon = ({ isLedger, imageStr }: { isLedger?: boolean; imageStr?: string }) => {
  return (
    <IconContainer isSR>
      {isLedger ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : imageStr ? (
        <Image resource={imageStr} alt="" width={32} height={32} />
      ) : (
        <FirstLetterIcon label={address} />
      )}
    </IconContainer>
  );
};

export default ValidatorIcon;
