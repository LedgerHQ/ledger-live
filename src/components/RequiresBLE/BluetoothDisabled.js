// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import Alert from "../../icons/Alert";

import LText from "../LText";
import InfoIcon from "../InfoIcon";
import colors from "../../colors";
import { deviceNames } from "../../wording";

const forceInset = { bottom: "always" };

export default class BluetoothDisabled extends PureComponent<{}> {
  render() {
    // NB based on the state we could have different wording?
    return (
      <SafeAreaView style={styles.container} forceInset={forceInset}>
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
          <LText style={styles.descFont}>
            <Trans
              i18nKey="bluetooth.checkEnabled"
              values={deviceNames.nanoX}
            />
          </LText>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  titleFont: {
    color: colors.darkBlue,
    fontSize: 18,
    marginTop: 32,
  },
  desc: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  descFont: {
    color: colors.smoke,
    fontSize: 14,
    textAlign: "center",
  },
});
