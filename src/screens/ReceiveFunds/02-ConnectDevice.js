// @flow
import React, { Component } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import StepHeader from "../../components/StepHeader";
import Stepper from "../../components/Stepper";
import SelectDevice from "../../components/SelectDevice";
import Button from "../../components/Button";
import { accountApp } from "../../components/SelectDevice/steps";

import colors from "../../colors";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
    },
  }>,
};

class ConnectDevice extends Component<Props> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Device" subtitle="2 of 4" />,
  };

  onSelectDevice = (deviceId: string) => {
    const { navigation, account } = this.props;
    navigation.navigate("ReceiveVerifyAddress", {
      accountId: account.id,
      deviceId,
    });
  };

  onSkipDevice = () => {
    const { navigation, account } = this.props;
    navigation.navigate("ReceiveConfirmation", {
      accountId: account.id,
    });
  };

  render() {
    const { account } = this.props;
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={2} />
        <SelectDevice
          onSelect={this.onSelectDevice}
          steps={[accountApp(account)]}
        />
        <Button
          type="secondary"
          title="Don't have my device"
          onPress={this.onSkipDevice}
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

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(ConnectDevice);
