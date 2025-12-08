import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import { getEnv } from "@ledgerhq/live-env";
import LedgerLogo from "@ledgerhq/icons-ui/native/LedgerLogo";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

interface Props {
  size?: number;
  validator?: HederaValidator;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const ValidatorIcon = ({ style, labelStyle, size = 64, validator }: Props) => {
  const { colors } = useTheme();

  const fontSize = Math.round(size / 2);
  const lineHeight = Math.round(fontSize * 1.6);
  const validatorName = validator?.name ?? "";
  const ledgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");
  const isLedger = validator?.nodeId === ledgerNodeId;
  const ledgerLogoSize = size > 32 ? "L" : "M";

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size={ledgerLogoSize} color={colors.text} />
      ) : (
        <FirstLetterIcon
          round
          label={validatorName}
          size={size}
          fontSize={fontSize}
          style={style}
          labelStyle={[{ lineHeight }, labelStyle]}
        />
      )}
    </Circle>
  );
};

export default ValidatorIcon;
