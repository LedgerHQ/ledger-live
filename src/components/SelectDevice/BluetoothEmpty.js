// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";

import { Trans } from "react-i18next";
import ConnectNanoXIllustration from "../../icons/ConnectNanoXIllustration";
import Button from "../Button";

type Props = {
  navigation: *,
};

class BluetoothEmpty extends PureComponent<Props> {
  onPairNewDevice = () => {
    const { navigation } = this.props;
    navigation.navigate("PairDevices");
  };

  render() {
    return (
      <View>
        <ConnectNanoXIllustration style={styles.illustration} />
        <Button
          event="PairDevice"
          type="primary"
          title={<Trans i18nKey="SelectDevice.deviceNotFoundPairNewDevice" />}
          onPress={this.onPairNewDevice}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  illustration: {
    alignSelf: "center",
    marginBottom: 24,
  },
});

export default withNavigation(BluetoothEmpty);
