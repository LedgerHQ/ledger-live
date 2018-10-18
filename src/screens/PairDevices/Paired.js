// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { translate, Trans } from "react-i18next";

import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import PairingSuccess from "../../icons/PairingSuccess";
import DeviceItemSummary from "../../components/DeviceItemSummary";

class Paired extends PureComponent<{
  deviceId: *,
  onContinue: () => *,
  navigation: *,
  t: *,
}> {
  onEdit = () => {
    const { deviceId, navigation } = this.props;
    navigation.navigate("EditDeviceName", {
      deviceId,
    });
  };

  render() {
    const { deviceId, onContinue, t } = this.props;
    return (
      <View style={styles.root}>
        <PairingSuccess />
        <LText secondary semiBold style={styles.title}>
          {t("PairDevices.Paired.title")}
        </LText>
        <LText style={styles.description}>
          <Trans i18nKey="PairDevices.Paired.desc">
            {"You can now use your Nano X on you Ledger Live mobile App to "}
            <LText semiBold>send & receive funds</LText>
            {". You can also mange your device on the "}
            <LText semiBold>Manager</LText>
            {" section"}
          </Trans>
        </LText>
        <View style={styles.fullContainer}>
          <DeviceItemSummary deviceId={deviceId} genuine onEdit={this.onEdit} />
        </View>
        <View style={[styles.fullContainer, styles.buttonContainer]}>
          <Button
            type="primary"
            title={t("PairDevices.Paired.action")}
            onPress={onContinue}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 38,
  },
  fullContainer: {
    width: "100%",
  },
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 16,
  },
  title: {
    marginTop: 24,
    fontSize: 18,
    color: colors.darkBlue,
  },
  description: {
    marginTop: 8,
    marginBottom: 40,
    textAlign: "center",
    fontSize: 14,
    paddingHorizontal: 40,
    color: colors.grey,
  },
});

export default withNavigation(translate()(Paired));
