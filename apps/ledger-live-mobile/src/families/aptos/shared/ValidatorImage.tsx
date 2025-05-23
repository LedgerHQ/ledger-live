import { useTheme } from "@react-navigation/native";
import { Image } from "react-native";
import React from "react";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import LedgerLogo from "~/icons/LiveLogo";

type Props = {
  size?: number;
  isLedger?: boolean;
  name?: string;
  imageStr?: string;
};

const ValidatorImage = ({ isLedger, size = 64, name }: Props) => {
  const { colors } = useTheme();

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size={size * 0.7} color={colors.text} />
      ) : imageStr ? (
        <Image resource={imageStr} alt="" width={32} height={32} />
      ) : (
        <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
      )}
    </Circle>
  );
};

export default ValidatorImage;
