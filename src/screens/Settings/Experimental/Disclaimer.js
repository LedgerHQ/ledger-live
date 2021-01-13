// @flow
import React, { memo } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";

import { useTheme } from "@react-navigation/native";
import shieldWarning from "../../../images/shield-warning.png";

import LText from "../../../components/LText";

const Disclaimer = () => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.card, borderColor: colors.fog },
      ]}
    >
      <Image style={styles.image} source={shieldWarning} />
      <View style={styles.textWrapper}>
        <LText style={[styles.text]} color="grey">
          <Trans i18nKey="settings.experimental.disclaimer" />
        </LText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 8,
  },
  image: {
    width: 40,
    marginBottom: 16,
  },
});

// $FlowFixMe
export default memo(Disclaimer);
