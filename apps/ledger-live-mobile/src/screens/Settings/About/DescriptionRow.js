/* @flow */
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import { deviceNames } from "../../../wording";
import LedgerLogo from "../../../icons/LiveLogo";

function DescriptionRow() {
  const { colors } = useTheme();
  return (
    <View style={styles.descriptionContainer}>
      <LedgerLogo size={50} color={colors.darkBlue} />
      <LText style={styles.description} color="smoke">
        <Trans
          i18nKey="settings.about.appDescription"
          values={deviceNames.nanoX}
        />
      </LText>
    </View>
  );
}

export default memo<*>(DescriptionRow);

const styles = StyleSheet.create({
  descriptionContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    alignItems: "center",
  },
  description: {
    textAlign: "center",
    margin: 16,
  },
});
