// @flow
import React, { Component } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import StepHeader from "../../components/StepHeader";
import Stepper from "../../components/Stepper";
import SelectDevice from "../../components/SelectDevice";
import Button from "../../components/Button";
import {
  connectingStep,
  accountApp,
  receiveVerifyStep,
} from "../../components/SelectDevice/steps";

import colors from "../../colors";

type Navigation = NavigationScreenProp<{
  params: {
    accountId: string,
  },
}>;

type Props = {
  account: Account,
  navigation: Navigation,
};

class ConnectDevice extends Component<Props> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Device" subtitle="2 of 3" />,
  };

  onSelectDevice = (deviceId: string) => {
    const { navigation, account } = this.props;
    navigation.navigate("ReceiveConfirmation", {
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
        <Stepper nbSteps={3} currentStep={2} />
        <SelectDevice
          onSelect={this.onSelectDevice}
          steps={[
            connectingStep,
            accountApp(account),
            receiveVerifyStep(account),
          ]}
        />
        <View style={styles.footer}>
          <Button
            type="secondary"
            title={<Trans i18nKey="transfer.receive.withoutDevice" />}
            onPress={this.onSkipDevice}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  footer: {
    padding: 10,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default compose(
  connect(mapStateToProps),
  translate(),
)(ConnectDevice);
