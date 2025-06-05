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

const ValidatorIcon = ({
  size = 64,
  name,
  validatorAddress,
}: Readonly<Omit<Props, "isLedger">>) => {
  const icon = validatorAddress ? new IconGenerator(validatorAddress).generate() : "";

  return icon ? (
    <Image source={{ uri: icon }} alt="" width={32} height={32} />
  ) : (
    <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
  );
};

const ValidatorImage = ({ isLedger, size = 64, name, validatorAddress }: Readonly<Props>) => {
  const { colors } = useTheme();

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size={size * 0.7} color={colors.text} />
      ) : (
        <ValidatorIcon size={size} name={name} validatorAddress={validatorAddress} />
      )}
    </Circle>
  );
};

export default ValidatorImage;
