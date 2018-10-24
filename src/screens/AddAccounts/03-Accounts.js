// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import { getCurrencyBridge } from "../../bridge";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      currency: CryptoCurrency,
      deviceId: string,
    },
  }>,
};

type State = {};

class AddAccountsAccounts extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Accounts" subtitle="step 3 of 4" />,
  };

  componentDidMount() {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    const deviceId = navigation.getParam("deviceId");
    const bridge = getCurrencyBridge(currency);

    this.scanSubscription = bridge
      .scanAccountsOnDevice(currency, deviceId)
      .subscribe({
        next: account => {
          console.log(`>> `, account);
        },
        complete: () => {
          console.log(`>> complete`);
        },
        error: err => {
          console.log(err);
        },
      });
  }

  componentWillUnmount() {
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
    }
  }

  next = () => {
    this.props.navigation.navigate("AddAccountsSuccess");
  };

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={3} />
        <LText>accounts</LText>
        <Button type="primary" title="next" onPress={this.next} />
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

export default translate()(AddAccountsAccounts);
