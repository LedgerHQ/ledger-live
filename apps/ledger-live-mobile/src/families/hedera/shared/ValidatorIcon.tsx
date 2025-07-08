import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import LedgerLogo from "@ledgerhq/icons-ui/native/LedgerLogo";
import { rgba } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

interface Props {
  color: string;
  size?: number;
  isLedger?: boolean;
  validatorName?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const ValidatorIcon = ({
  color,
  style,
  size = 64,
  validatorName = "-",
  isLedger = true,
}: Props) => {
  const { colors } = useTheme();
  const fontSize = Math.round(size / 2);
  const lineHeight = Math.round(fontSize * 1.6);

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size="M" color={colors.text} />
      ) : (
        <FirstLetterIcon
          round
          label={validatorName}
          size={size}
          fontSize={fontSize}
          style={[{ paddingHorizontal: 0, backgroundColor: rgba(color, 0.2) }, style]}
          labelStyle={[{ lineHeight }, style]}
        />
      )}
    </Circle>
  );
};

export default ValidatorIcon;
