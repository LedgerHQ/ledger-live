// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { getDeviceModel } from "@ledgerhq/devices";

import { useTheme } from "@react-navigation/native";
import Rounded from "../Rounded";
import LText from "../LText";

type Props = {
  navigation: *,
};

function ScanningFooter() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Rounded bg={colors.pillActiveBackground}>
        <Icon name="bluetooth" color={colors.live} size={28} />
      </Rounded>
      <LText style={styles.text} color="smoke">
        <Trans
          i18nKey="SelectDevice.headerDescription"
          values={getDeviceModel("nanoX")}
        />
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 24,
    paddingBottom: 32,
    flexDirection: "column",
    alignItems: "center",
  },
  text: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});

export default memo<Props>(ScanningFooter);
