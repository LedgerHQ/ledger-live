import React from "react";
import { AptosValidator } from "@ledgerhq/live-common/families/aptos/types";
import * as blockies from "blockies-ts";
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
  const address = (validator && validator.address) || validatorId || "";
  const avatarUrl = address ? blockies.create({ seed: address.toLowerCase() }).toDataURL() : "";

  return (
    <IconContainer isSR>
      {/* {LEDGER_APTOS_VALIDATOR_ADDRESS.includes(address) ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={address} />
      )} */}
      {avatarUrl ? (
        <Image resource={avatarUrl} alt="" width={32} height={32} />
      ) : (
        <FirstLetterIcon label={address} />
      )}
    </IconContainer>
  );
};

export default ValidatorIcon;
