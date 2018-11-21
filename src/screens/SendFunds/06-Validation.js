/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { AndroidBackHandler } from "react-navigation-backhandler";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { getAccountBridge } from "../../bridge";
import { accountScreenSelector } from "../../reducers/accounts";

import StepHeader from "../../components/StepHeader";

import colors from "../../colors";
import ValidateOnDevice from "./ValidateOnDevice";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      transaction: *,
    },
  }>,
};

type State = {
  signed: boolean,
};

class Validation extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("send.stepperHeader.verification")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "6",
          totalSteps: "6",
        })}
      />
    ),
    headerLeft: null,
    headerRight: null,
  };

  state = {
    signed: false,
  };

  componentDidMount() {
    this.sign();
  }

  sign() {
    const { account, navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    bridge.signAndBroadcast(account, transaction, deviceId).subscribe({
      next: e => {
        switch (e.type) {
          case "signed":
            this.setState({ signed: true });
            break;
          case "broadcasted":
            // $FlowFixMe
            navigation.replace("SendValidationSuccess", {
              ...navigation.state.params,
              result: e.operation,
            });
            break;
          default:
        }
      },
      error: error => {
        // $FlowFixMe
        navigation.replace("SendValidationError", {
          ...navigation.state.params,
          error,
        });
      },
    });
  }

  render() {
    const { signed } = this.state;
    return (
      <AndroidBackHandler
        // Disabling Android back button when navigation not allowed
        onBackPress={() => true}
      >
        <View style={styles.root}>
          {signed ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <ValidateOnDevice action={this.sign} />
          )}
        </View>
      </AndroidBackHandler>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(translate()(Validation));
