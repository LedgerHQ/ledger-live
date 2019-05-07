/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import { updateAccountWithUpdater } from "../../actions/accounts";

import { getAccountBridge } from "../../bridge";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateOnDevice from "./ValidateOnDevice";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";

type Props = {
  account: Account,
  updateAccountWithUpdater: (string, (Account) => Account) => void,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      modelId: DeviceModelId,
      wired: boolean,
      transaction: *,
    },
  }>,
};

const mapDispatchToProps = {
  updateAccountWithUpdater,
};

type State = {
  signing: boolean,
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
    gesturesEnabled: false,
  };

  state = {
    signing: false,
    signed: false,
  };

  sub = null;

  componentDidMount() {
    this.sign();
  }

  sign() {
    const { account, navigation, updateAccountWithUpdater } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const { addPendingOperation } = bridge;

    this.sub = bridge
      .signAndBroadcast(account, transaction, deviceId)
      .subscribe({
        next: e => {
          switch (e.type) {
            case "signing": {
              const n = this.props.navigation.dangerouslyGetParent();
              this.setState({ signing: true });
              if (n) n.setParams({ allowNavigation: false });
              break;
            }
            case "signed":
              this.setState({ signed: true });
              break;
            case "broadcasted":
              // $FlowFixMe
              navigation.replace("SendValidationSuccess", {
                ...navigation.state.params,
                result: e.operation,
              });

              if (addPendingOperation) {
                updateAccountWithUpdater(account.id, account =>
                  addPendingOperation(account, e.operation),
                );
              }

              break;
            default:
          }
        },
        error: e => {
          let error = e;
          if (e && e.statusCode === 0x6985) {
            error = new UserRefusedOnDevice();
          } else {
            logger.critical(error);
          }

          // $FlowFixMe
          navigation.replace("SendValidationError", {
            ...navigation.state.params,
            error,
          });
        },
      });
  }

  render() {
    const { signed, signing } = this.state;
    const { navigation, account } = this.props;
    const transaction = navigation.getParam("transaction");
    const modelId = navigation.getParam("modelId");
    const wired = navigation.getParam("wired");
    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="SendFunds" name="Validation" signed={signed} />
        {signing && (
          <>
            <PreventNativeBack />
            <SkipLock />
          </>
        )}

        {signed ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ValidateOnDevice
            wired={wired}
            modelId={modelId}
            account={account}
            transaction={transaction}
            action={this.sign}
          />
        )}
      </SafeAreaView>
    );
  }

  componentWillUnmount() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    const n = this.props.navigation.dangerouslyGetParent();
    if (n) n.setParams({ allowNavigation: true });
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(translate()(Validation));
