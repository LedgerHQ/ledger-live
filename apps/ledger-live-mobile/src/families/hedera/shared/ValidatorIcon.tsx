import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import { getEnv } from "@ledgerhq/live-env";
import LedgerLogo from "@ledgerhq/icons-ui/native/LedgerLogo";
import { rgba } from "@ledgerhq/native-ui";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

interface Props {
  color: string;
  size?: number;
  validator?: HederaValidator;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const ValidatorIcon = ({ color, style, labelStyle, size = 64, validator }: Props) => {
  const { colors } = useTheme();
  const fontSize = Math.round(size / 2);
  const lineHeight = Math.round(fontSize * 1.6);

  const validatorName = validator?.name ?? "-";
  const ledgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");
  const isLedger = validator?.nodeId === ledgerNodeId;

  return (
    <Circle crop bg={color} size={size}>
      {isLedger ? (
        <LedgerLogo size="M" color={colors.text} />
      ) : (
        <FirstLetterIcon
          round
          label={validatorName}
          size={size}
          fontSize={fontSize}
          style={[{ paddingHorizontal: 0, backgroundColor: rgba(color, 0.2) }, style]}
          labelStyle={[{ lineHeight }, labelStyle]}
        />
      )}
    </Circle>
  );
};

export default ValidatorIcon;
