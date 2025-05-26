import { useTheme } from "@react-navigation/native";
import { Image } from "react-native";
import React from "react";
import { IconGenerator } from "@ledgerhq/live-common/families/aptos/utils";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import LedgerLogo from "~/icons/LiveLogo";

type Props = {
  size?: number;
  isLedger?: boolean;
  name?: string;
  validatorAddress?: string;
};

const ValidatorImage = ({ isLedger, size = 64, name, validatorAddress }: Props) => {
  const { colors } = useTheme();
  const icon = validatorAddress ? new IconGenerator(validatorAddress).generate() : "";

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size={size * 0.7} color={colors.text} />
      ) : icon ? (
        <Image source={{ uri: icon }} alt="" width={32} height={32} />
      ) : (
        <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
      )}
    </Circle>
  );
};

export default ValidatorImage;
