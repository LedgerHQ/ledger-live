/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import { addPendingOperation } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { DeviceModelId } from "@ledgerhq/devices";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import PreventNativeBack from "../../components/PreventNativeBack";
import ValidateOnDevice from "./ValidateOnDevice";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";

type Props = {
  account: ?(Account | TokenAccount),
  parentAccount: ?Account,
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
    const {
      account,
      parentAccount,
      navigation,
      updateAccountWithUpdater,
    } = this.props;
    if (!account) return;
    const deviceId = navigation.getParam("deviceId");
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    this.sub = bridge
      .signAndBroadcast(mainAccount, transaction, deviceId)
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

              updateAccountWithUpdater(mainAccount.id, account =>
                addPendingOperation(account, e.operation),
              );

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
    const { navigation, account, parentAccount } = this.props;
    if (!account) return null;
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
            parentAccount={parentAccount}
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

const mapStateToProps = accountAndParentScreenSelector;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(translate()(Validation));
