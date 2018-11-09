// @flow
import React, { Component } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import i18next from "i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import StepHeader from "../../components/StepHeader";
import SelectDevice from "../../components/SelectDevice";
import {
  connectingStep,
  accountApp,
} from "../../components/SelectDevice/steps";

import colors from "../../colors";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: *,
    },
  }>,
};

class ConnectDevice extends Component<Props> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("send.stepperHeader.connectDevice")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "5",
          totalSteps: "6",
        })}
      />
    ),
  };

  onSelectDevice = (deviceId: string) => {
    const { navigation } = this.props;
    navigation.navigate("SendValidation", {
      ...navigation.state.params,
      deviceId,
    });
  };

  render() {
    const { account } = this.props;
    return (
      <SafeAreaView style={styles.root}>
        <SelectDevice
          onSelect={this.onSelectDevice}
          steps={[connectingStep, accountApp(account)]}
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

export default compose(
  connect(mapStateToProps),
  translate(),
)(ConnectDevice);
