// @flow

import React, { memo } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import Alert from "../../icons/Alert";

import LText from "../LText";
import InfoIcon from "../InfoIcon";
import { deviceNames } from "../../wording";

function BluetoothDisabled() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      <InfoIcon
        bg={colors.pillActiveBackground}
        floatingIcon={<Alert size={20} color={colors.white} />}
        floatingBg={colors.alert}
      >
        <Icon name="bluetooth" size={40} color={colors.live} />
      </InfoIcon>
      <View>
        <LText semiBold secondary style={styles.titleFont}>
          <Trans i18nKey="bluetooth.required" />
        </LText>
      </View>
      <View style={styles.desc}>
        <LText style={styles.descFont} color="smoke">
          <Trans i18nKey="bluetooth.checkEnabled" values={deviceNames.nanoX} />
        </LText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleFont: {
    fontSize: 18,
    marginTop: 32,
  },
  desc: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  descFont: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default memo(BluetoothDisabled);
