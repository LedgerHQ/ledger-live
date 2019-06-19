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
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
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
  account: ?(Account | TokenAccount),
  parentAccount: ?Account,
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
    const { account, parentAccount } = this.props;
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    const bridge = getAccountBridge(account, parentAccount);
    if (
      !bridge.getTransactionNetworkInfo(mainAccount, this.state.transaction) &&
      !this.state.syncNetworkInfoError
    ) {
      try {
        this.networkInfoPending = true;
        const networkInfo = await bridge.fetchTransactionNetworkInfo(
          mainAccount,
        );
        if (!this.networkInfoPending) return;
        this.setState(({ transaction }, { account, parentAccount }) =>
          !account
            ? null
            : {
                syncNetworkInfoError: null,
                transaction: getAccountBridge(
                  account,
                  parentAccount,
                ).applyTransactionNetworkInfo(
                  getMainAccount(account, parentAccount),
                  transaction,
                  networkInfo,
                ),
              },
        );
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
    const { account, parentAccount } = this.props;
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    const { transaction } = this.state;
    const bridge = getAccountBridge(account, parentAccount);
    const nonce = ++this.nonceTotalSpent;
    try {
      const totalSpent = await bridge.getTotalSpent(mainAccount, transaction);
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
    const { account, parentAccount } = this.props;
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    const { transaction } = this.state;
    const bridge = getAccountBridge(account, parentAccount);
    const nonce = ++this.nonceValidTransaction;
    try {
      const txValidationWarning = await bridge.checkValidTransaction(
        mainAccount,
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
      this.setState(({ transaction }, { account, parentAccount }) =>
        !account
          ? null
          : {
              transaction: getAccountBridge(
                account,
                parentAccount,
              ).editTransactionAmount(
                getMainAccount(account, parentAccount),
                transaction,
                amount,
              ),
            },
      );
    }
  };

  blur = () => {
    Keyboard.dismiss();
  };

  navigate = () => {
    const { account, parentAccount, navigation } = this.props;
    if (!account) return;
    const { transaction } = this.state;
    navigation.navigate("SendSummary", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  };

  render() {
    const { account, parentAccount } = this.props;
    if (!account) return null;
    const mainAccount = getMainAccount(account, parentAccount);
    const {
      transaction,
      syncNetworkInfoError,
      syncValidTransactionError,
      syncTotalSpentError,
      totalSpent,
      leaving,
    } = this.state;
    const bridge = getAccountBridge(account, parentAccount);
    const amount = bridge.getTransactionAmount(mainAccount, transaction);
    const networkInfo = bridge.getTransactionNetworkInfo(
      mainAccount,
      transaction,
    );
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

    const unit = getAccountUnit(account);

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
                  currency={unit.code}
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
                          unit={unit}
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

const mapStateToProps = accountAndParentScreenSelector;

export default compose(
  translate(),
  connect(mapStateToProps),
)(SendAmount);
