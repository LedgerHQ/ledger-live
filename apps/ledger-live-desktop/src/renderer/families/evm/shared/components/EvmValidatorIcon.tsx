import React from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";

type Props = {
  validator?: { validatorAddress?: string; name?: string } | null;
};

const EvmValidatorIcon = ({ validator }: Props) => (
  <IconContainer isSR>
    <FirstLetterIcon label={validator?.name || validator?.validatorAddress} />
  </IconContainer>
);

export default EvmValidatorIcon;
