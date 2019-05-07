/* @flow */
import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { BigNumber } from "bignumber.js";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { getAccountBridge } from "../../bridge";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Button from "../../components/Button";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import AmountInput from "./AmountInput";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: *,
    },
  }>,
};

type State = {
  transaction: *,
  syncNetworkInfoError: ?Error,
  syncTotalSpentError: ?Error,
  syncValidTransactionError: ?Error,
  txValidationWarning: ?Error,
  totalSpent: ?BigNumber,
  leaving: boolean,
};

const similarError = (a, b) =>
  a === b || (a && b && a.name === b.name && a.message === b.message);

class SendAmount extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("send.stepperHeader.selectAmount")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "3",
          totalSteps: "6",
        })}
      />
    ),
  };

  constructor({ navigation }) {
    super();
    const transaction = navigation.getParam("transaction");
    this.state = {
      transaction,
      syncNetworkInfoError: null,
      syncTotalSpentError: null,
      syncValidTransactionError: null,
      txValidationWarning: null,
      totalSpent: null,
      leaving: false,
    };
  }

  componentDidMount() {
    this.validate();
  }

  componentDidUpdate() {
    this.validate();
  }

  componentWillUnmount() {
    this.nonceTotalSpent++;
    this.nonceValidTransaction++;
    this.networkInfoPending = false;
  }

  networkInfoPending = false;
  syncNetworkInfo = async () => {
    if (this.networkInfoPending) return;
    const { account } = this.props;
    const bridge = getAccountBridge(account);
    if (
      !bridge.getTransactionNetworkInfo(account, this.state.transaction) &&
      !this.state.syncNetworkInfoError
    ) {
      try {
        this.networkInfoPending = true;
        const networkInfo = await bridge.fetchTransactionNetworkInfo(account);
        if (!this.networkInfoPending) return;
        this.setState(({ transaction }, { account }) => ({
          syncNetworkInfoError: null,
          transaction: getAccountBridge(account).applyTransactionNetworkInfo(
            account,
            transaction,
            networkInfo,
          ),
        }));
      } catch (syncNetworkInfoError) {
        if (!this.networkInfoPending) return;
        this.setState(old => {
          if (similarError(old.syncNetworkInfoError, syncNetworkInfoError))
            return null;
          return { syncNetworkInfoError };
        });
      } finally {
        this.networkInfoPending = false;
      }
    }
  };

  nonceTotalSpent = 0;
  syncTotalSpent = async () => {
    const { account } = this.props;
    const { transaction } = this.state;
    const bridge = getAccountBridge(account);
    const nonce = ++this.nonceTotalSpent;
    try {
      const totalSpent = await bridge.getTotalSpent(account, transaction);
      if (nonce !== this.nonceTotalSpent) return;

      this.setState(old => {
        if (
          !old.syncTotalSpentError &&
          old.totalSpent &&
          totalSpent &&
          totalSpent.eq(old.totalSpent)
        ) {
          return null;
        }
        return { totalSpent, syncTotalSpentError: null };
      });
    } catch (syncTotalSpentError) {
      if (nonce !== this.nonceTotalSpent) return;
      this.setState(old => {
        if (similarError(old.syncTotalSpentError, syncTotalSpentError))
          return null;
        return { syncTotalSpentError };
      });
    }
  };

  nonceValidTransaction = 0;
  syncValidTransaction = async () => {
    const { account } = this.props;
    const { transaction } = this.state;
    const bridge = getAccountBridge(account);
    const nonce = ++this.nonceValidTransaction;
    try {
      const txValidationWarning = await bridge.checkValidTransaction(
        account,
        transaction,
      );
      if (nonce !== this.nonceValidTransaction) return;

      this.setState(old => {
        if (
          !old.syncValidTransactionError &&
          similarError(old.txValidationWarning, txValidationWarning)
        ) {
          return null;
        }
        return {
          txValidationWarning,
          syncValidTransactionError: null,
        };
      });
    } catch (syncValidTransactionError) {
      if (nonce !== this.nonceValidTransaction) return;
      this.setState(old => {
        if (
          similarError(old.syncValidTransactionError, syncValidTransactionError)
        )
          return null;
        return { syncValidTransactionError };
      });
    }
  };

  validate = () => {
    this.syncNetworkInfo();
    this.syncTotalSpent();
    this.syncValidTransaction();
  };

  onNetworkInfoCancel = () => {
    this.setState({ leaving: true });
    const n = this.props.navigation.dangerouslyGetParent();
    if (n) n.goBack();
  };

  onNetworkInfoRetry = () => {
    this.setState({
      syncNetworkInfoError: null,
      syncTotalSpentError: null,
      syncValidTransactionError: null,
    });
  };

  onChange = (amount: BigNumber) => {
    if (!amount.isNaN()) {
      this.setState(({ transaction }, { account }) => ({
        transaction: getAccountBridge(account).editTransactionAmount(
          account,
          transaction,
          amount,
        ),
      }));
    }
  };

  blur = () => {
    Keyboard.dismiss();
  };

  navigate = () => {
    const { account, navigation } = this.props;
    const { transaction } = this.state;
    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction,
    });
  };

  render() {
    const { account } = this.props;
    const {
      transaction,
      syncNetworkInfoError,
      syncValidTransactionError,
      syncTotalSpentError,
      totalSpent,
      leaving,
    } = this.state;
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);
    const networkInfo = bridge.getTransactionNetworkInfo(account, transaction);
    const pending = !networkInfo && !syncNetworkInfoError;

    const criticalError = syncNetworkInfoError;
    const inlinedError = criticalError
      ? null
      : syncValidTransactionError || syncTotalSpentError;

    const canNext: boolean =
      !!networkInfo &&
      !criticalError &&
      !inlinedError &&
      !!totalSpent &&
      totalSpent.gt(0) &&
      !transaction.amount.isZero();

    return (
      <>
        <TrackScreen category="SendFunds" name="Amount" />
        <SafeAreaView style={styles.root}>
          <KeyboardView style={styles.container}>
            <TouchableWithoutFeedback onPress={this.blur}>
              <View style={{ flex: 1 }}>
                <AmountInput
                  account={account}
                  onChange={this.onChange}
                  currency={account.unit.code}
                  value={amount}
                  error={inlinedError}
                />

                <View style={styles.bottomWrapper}>
                  <LText style={styles.available}>
                    <Trans i18nKey="send.amount.available">
                      {"text"}
                      <LText tertiary style={styles.availableAmount}>
                        <CurrencyUnitValue
                          showCode
                          unit={account.unit}
                          value={account.balance}
                        />
                      </LText>
                      {"text"}
                    </Trans>
                  </LText>
                  <View style={styles.continueWrapper}>
                    <Button
                      event="SendAmountContinue"
                      type="primary"
                      title={
                        <Trans
                          i18nKey={
                            !pending
                              ? "common.continue"
                              : "send.amount.loadingNetwork"
                          }
                        />
                      }
                      onPress={this.navigate}
                      disabled={!canNext}
                      pending={pending}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardView>
        </SafeAreaView>

        <GenericErrorBottomModal
          error={leaving ? null : criticalError}
          onClose={this.onNetworkInfoRetry}
          footerButtons={
            <>
              <CancelButton
                containerStyle={styles.button}
                onPress={this.onNetworkInfoCancel}
              />
              <RetryButton
                containerStyle={[styles.button, styles.buttonRight]}
                onPress={this.onNetworkInfoRetry}
              />
            </>
          }
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  available: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 16,
  },
  availableAmount: {
    color: colors.darkBlue,
  },
  bottomWrapper: {
    flex: 1,
    flexGrow: 1,
    flexDirection: "column",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});

const mapStateToProps = (state, props: Props): { account: Account } => ({
  account: accountScreenSelector(state, props),
});

export default compose(
  translate(),
  connect(mapStateToProps),
)(SendAmount);
