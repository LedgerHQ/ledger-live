import { useTheme } from "styled-components/native";
import React from "react";
import Circle from "../../../components/Circle";
import FirstLetterIcon from "../../../components/FirstLetterIcon";
import LedgerLogo from "../../../icons/LiveLogo";

type Props = {
  size?: number;
  isLedger?: boolean;
  name?: string;
};

const ValidatorImage = ({ isLedger, size = 64, name }: Props) => {
  const { colors } = useTheme();

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size={size * 0.7} color={colors.neutral.c100} />
      ) : (
        <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
      )}
    </Circle>
  );
};

export default ValidatorImage;
