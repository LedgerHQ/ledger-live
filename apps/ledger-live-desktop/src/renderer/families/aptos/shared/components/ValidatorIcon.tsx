import React from "react";
import { AptosValidator } from "@ledgerhq/live-common/families/aptos/types";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Image from "~/renderer/components/Image";
// import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
// import Logo from "~/renderer/icons/Logo";

const ValidatorIcon = ({
  validator,
  validatorId,
}: {
  validator?: AptosValidator | null;
  validatorId?: string;
}) => {
  const address = (validator && validator.address) || validatorId;

  return (
    <IconContainer isSR>
      {/* {LEDGER_APTOS_VALIDATOR_ADDRESS.includes(address) ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={address} />
      )} */}
      {validator && validator.avatarUrl !== undefined ? (
        <Image resource={validator.avatarUrl} alt="" width={32} height={32} />
      ) : (
        <FirstLetterIcon label={address} />
      )}
    </IconContainer>
  );
};

export default ValidatorIcon;
