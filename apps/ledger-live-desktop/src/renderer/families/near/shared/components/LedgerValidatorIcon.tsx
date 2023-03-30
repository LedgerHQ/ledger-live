import { NearValidatorItem } from "@ledgerhq/live-common/families/near/types";
import React from "react";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/near/logic";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
const LedgerValidatorIcon = ({
  validator,
  validatorId,
}: {
  validator: NearValidatorItem;
  validatorId: string;
}) => {
  const address = (validator && validator.validatorAddress) || validatorId;
  return (
    <IconContainer isSR>
      {address === FIGMENT_NEAR_VALIDATOR_ADDRESS ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={address} />
      )}
    </IconContainer>
  );
};
export default LedgerValidatorIcon;
