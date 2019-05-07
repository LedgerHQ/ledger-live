// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import ConnectNanoXIllustration from "../../icons/ConnectNanoXIllustration";
import Button from "../Button";

type Props = {
  onPairNewDevice: () => void,
};

class BluetoothEmpty extends PureComponent<Props> {
  render() {
    return (
      <View>
        <ConnectNanoXIllustration style={styles.illustration} />
        <Button
          event="PairDevice"
          type="primary"
          title={<Trans i18nKey="SelectDevice.deviceNotFoundPairNewDevice" />}
          onPress={this.props.onPairNewDevice}
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

export default BluetoothEmpty;
