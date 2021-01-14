/* @flow */
import React, { memo } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import { deviceNames } from "../../../wording";

function DescriptionRow() {
  return (
    <View style={styles.descriptionContainer}>
      <Image source={require("../../../images/logo_small.png")} />
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
