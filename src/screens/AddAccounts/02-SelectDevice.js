// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import SelectDevice from "../../components/SelectDevice";
import { connectingStep, currencyApp } from "../../components/DeviceJob/steps";
import StepHeader from "../../components/StepHeader";

import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      currency: CryptoCurrency,
    },
  }>,
};

type State = {};

class AddAccountsSelectDevice extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Device" subtitle="step 2 of 3" />,
  };

  onSelectDevice = (deviceId: string) => {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    navigation.navigate("AddAccountsAccounts", { currency, deviceId });
  };

  render() {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    return (
      <SafeAreaView style={styles.root}>
        <SelectDevice
          onSelect={this.onSelectDevice}
          steps={[connectingStep, currencyApp(currency)]}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default translate()(AddAccountsSelectDevice);
