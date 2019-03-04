// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import i18next from "i18next";

import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import { connectingStep, currencyApp } from "../../components/DeviceJob/steps";
import StepHeader from "../../components/StepHeader";

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
    headerTitle: (
      <StepHeader
        title={i18next.t("common.device")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "2",
          totalSteps: "3",
        })}
      />
    ),
  };

  onSelectDevice = (meta: *) => {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    navigation.navigate("AddAccountsAccounts", { currency, ...meta });
  };

  render() {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="AddAccounts" name="SelectDevice" />
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
