import { AptosValidator } from "@ledgerhq/live-common/families/aptos/types";
import React from "react";
// import { FIGMENT_APTOS_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/aptos/constants";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
// import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
// import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Image from "~/renderer/components/Image";

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
      {/* {address === FIGMENT_APTOS_VALIDATOR_ADDRESS ? (
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
