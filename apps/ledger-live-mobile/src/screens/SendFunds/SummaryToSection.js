/* @flow */
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "../../components/Circle";
import LText from "../../components/LText";
import QRcode from "../../icons/QRcode";

type Props = {
  recipient: string,
};
function SummaryToSection({ recipient }: Props) {
  const { colors } = useTheme();
  return (
    <SummaryRowCustom
      label={<Trans i18nKey="send.summary.to" />}
      iconLeft={
        <Circle bg={colors.lightLive} size={34}>
          <QRcode size={16} />
        </Circle>
      }
      data={
        <LText numberOfLines={2} style={styles.summaryRowText}>
          {recipient}
        </LText>
      }
    />
  );
}
const styles = StyleSheet.create({
  summaryRowText: {
    fontSize: 16,
  },
});

export default memo<Props>(SummaryToSection);
