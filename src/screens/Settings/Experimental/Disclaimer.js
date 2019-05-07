// @flow
import React, { memo } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";

import shieldWarning from "../../../images/shield-warning.png";
import colors from "../../../colors";

import LText from "../../../components/LText";

const Disclaimer = () => (
  <View style={[styles.wrapper]}>
    <Image style={styles.image} source={shieldWarning} />
    <View style={styles.textWrapper}>
      <LText style={[styles.text]}>
        <Trans i18nKey="settings.experimental.disclaimer" />
      </LText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: colors.lightGrey,
    borderWidth: 1,
    borderColor: colors.fog,
    borderStyle: "dashed",
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: colors.grey,
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
