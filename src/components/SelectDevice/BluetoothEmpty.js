// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";

import { Trans } from "react-i18next";
import ConnectNanoXIllustration from "../../icons/ConnectNanoXIllustration";
import Button from "../Button";
import SectionSeparator from "../SectionSeparator";

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
        <SectionSeparator
          style={styles.or}
          text={<Trans i18nKey="common.or" />}
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
  or: {
    marginVertical: 30,
  },
});

export default withNavigation(BluetoothEmpty);
