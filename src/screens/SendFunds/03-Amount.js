/* @flow */
import React, { Component } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { BigNumber } from "bignumber.js";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { NotEnoughBalance } from "@ledgerhq/live-common/lib/errors";

import type { T } from "../../types/common";
import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { getAccountBridge } from "../../bridge";
import LText from "../../components/LText/index";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Button from "../../components/Button";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import AmountInput from "./AmountInput";

type Props = {
  t: T,
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
  networkInfoError: ?Error,
  notEnoughBalanceError: ?Error,
  txValidationWarning: ?Error,
  totalSpent: ?BigNumber,
  leaving: boolean,
};

const similarError = (a, b) =>
  a === b || (a && b && a.name === b.name && a.message === b.message);

class SendAmount extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Amount" subtitle="step 3 of 6" />,
  };

  constructor({ navigation }) {
    super();
    const transaction = navigation.getParam("transaction");
    this.state = {
      transaction,
      networkInfoError: null,
      notEnoughBalanceError: null,
      txValidationWarning: null,
      totalSpent: null,
      leaving: false,
    };
  }

  setError = (e: Error) => {
    if (e instanceof NotEnoughBalance) {
      this.setState(old => {
        if (similarError(old.notEnoughBalanceError, e)) return null;
        return { notEnoughBalanceError: e };
      });
    } else if (this.state.notEnoughBalanceError) {
      this.setState(old => {
        if (!old.notEnoughBalanceError) return null;
        return { notEnoughBalanceError: null };
      });
    }
  };

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
      !this.state.networkInfoError
    ) {
      try {
        this.networkInfoPending = true;
        const networkInfo = await bridge.fetchTransactionNetworkInfo(account);
        if (!this.networkInfoPending) return;
        this.setState(({ transaction }, { account }) => ({
          networkInfoError: null,
          transaction: getAccountBridge(account).applyTransactionNetworkInfo(
            account,
            transaction,
            networkInfo,
          ),
        }));
      } catch (networkInfoError) {
        this.setState(oldState => {
          if (similarError(oldState.networkInfoError, networkInfoError)) {
            return null;
          }
          return { networkInfoError };
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
        if (old.totalSpent && totalSpent && totalSpent.eq(old.totalSpent)) {
          return null;
        }
        return { totalSpent };
      });
    } catch (e) {
      if (nonce !== this.nonceTotalSpent) return;

      // FIXME potential race condition we should separate the different error and make sure it's set to null in normal case
      this.setError(e);
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
        if (!old.notEnoughBalanceError) {
          if (similarError(old.txValidationWarning, txValidationWarning)) {
            return null;
          }
        }
        return {
          txValidationWarning,
          notEnoughBalanceError: null,
        };
      });
    } catch (e) {
      if (nonce !== this.nonceValidTransaction) return;

      this.setError(e);
    }
  };

  validate = () => {
    this.syncNetworkInfo();
    this.syncTotalSpent();
    this.syncValidTransaction();
  };

  onNetworkInfoCancel = () => {
    this.setState({ leaving: true });
    this.props.navigation.dangerouslyGetParent().goBack();
  };

  onNetworkInfoRetry = () => {
    this.setState({ networkInfoError: null });
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
    const { account, t } = this.props;
    const {
      transaction,
      notEnoughBalanceError,
      networkInfoError,
      txValidationWarning,
      totalSpent,
      leaving,
    } = this.state;
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);
    const networkInfo = bridge.getTransactionNetworkInfo(account, transaction);
    const pending = !networkInfo && !networkInfoError;

    const canNext: boolean =
      !!totalSpent &&
      !notEnoughBalanceError &&
      !networkInfoError &&
      txValidationWarning === null &&
      !transaction.amount.isZero() &&
      totalSpent.gt(0) &&
      !!networkInfo;

    return (
      <>
        <SafeAreaView style={styles.root}>
          <Stepper nbSteps={5} currentStep={3} />
          <KeyboardView style={styles.container}>
            <TouchableWithoutFeedback onPress={this.blur}>
              <View style={{ flex: 1 }}>
                <AmountInput
                  account={account}
                  onChange={this.onChange}
                  currency={account.unit.code}
                  value={amount}
                  error={notEnoughBalanceError}
                />

                <View style={styles.bottomWrapper}>
                  <LText style={styles.available}>
                    <Trans i18nKey="send.amount.available">
                      You have
                      <LText tertiary style={styles.availableAmount}>
                        <CurrencyUnitValue
                          showCode
                          unit={account.unit}
                          value={account.balance}
                        />
                      </LText>
                      available
                    </Trans>
                  </LText>
                  <View style={styles.continueWrapper}>
                    <Button
                      type="primary"
                      title={
                        !pending
                          ? t("common.continue")
                          : t("send.amount.loadingNetwork")
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
          error={leaving ? null : networkInfoError}
          footerButtons={
            <>
              <CancelButton
                containerStyle={styles.button}
                onPress={this.onNetworkInfoCancel}
              />
              <RetryButton
                containerStyle={styles.button}
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
  countervaluesWrapper: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  countervaluesText: {
    color: colors.grey,
    fontSize: 20,
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
});

const mapStateToProps = (state, props: Props): { account: Account } => ({
  account: accountScreenSelector(state, props),
});

export default compose(
  translate(),
  connect(mapStateToProps),
)(SendAmount);
