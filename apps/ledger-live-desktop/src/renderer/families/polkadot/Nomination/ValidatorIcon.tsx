import React from "react";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";

type ValidatorIconProps = {
  validatorAddress: string;
};

export const ValidatorIcon = ({ validatorAddress }: ValidatorIconProps) => {
  return <FirstLetterIcon label={validatorAddress} />;
};
