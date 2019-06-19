/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import { connect } from "react-redux";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import LText from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import SummaryFromSection from "./SummaryFromSection";
import SummaryToSection from "./SummaryToSection";
import SummaryAmountSection from "./SummaryAmountSection";
import SendRowsCustom from "../../families/SendRowsCustom";
import SendRowsFee from "../../families/SendRowsFee";
import SummaryTotalSection from "./SummaryTotalSection";
import StepHeader from "../../components/StepHeader";
import SectionSeparator from "../../components/SectionSeparator";
import AlertTriangle from "../../icons/AlertTriangle";
import ConfirmationModal from "../../components/ConfirmationModal";

// TODO put this somewhere
const similarError = (a, b) =>
  a === b || (a && b && a.name === b.name && a.message === b.message);

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

class SendSummary extends Component<
  Props,
  {
    totalSpent: ?BigNumber,
    error: ?Error,
    highFeesOpen: boolean,
  },
> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("send.stepperHeader.summary")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "4",
          totalSteps: "6",
        })}
      />
    ),
  };

  state = {
    totalSpent: null,
    error: null, // TODO use error somewhere!
    highFeesOpen: false,
  };

  componentDidMount() {
    this.syncTotalSpent();
  }

  componentDidUpdate() {
    this.syncTotalSpent();
  }

  componentWillUnmount() {
    this.nonceTotalSpent++;
  }

  openFees = () => {
    const { account, parentAccount, navigation } = this.props;
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount);
    this.props.navigation.navigate("EditFees", {
      accountId: mainAccount.id,
      transaction: navigation.getParam("transaction"),
    });
  };

  onContinue = async () => {
    const { account, parentAccount, navigation } = this.props;
    if (!account) return;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    await bridge.checkValidTransaction(mainAccount, transaction);

    if (bridge && account && transaction) {
      const totalSpent = await bridge.getTotalSpent(mainAccount, transaction);
      if (
        totalSpent
          .minus(transaction.amount)
          .times(10)
          .gt(transaction.amount)
      ) {
        this.setState({ highFeesOpen: true });
        return;
      }
    }
    navigation.navigate("SendConnectDevice", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  };

  setError = (error: Error) => {
    this.setState(old => {
      if (similarError(old.error, error)) return null;
      return { error };
    });
  };

  // React Hooks PLZ. same code as step 3.
  nonceTotalSpent = 0;
  syncTotalSpent = async () => {
    const { account, parentAccount, navigation } = this.props;
    if (!account) return;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    const nonce = ++this.nonceTotalSpent;
    try {
      const totalSpent = await bridge.getTotalSpent(mainAccount, transaction);
      if (nonce !== this.nonceTotalSpent) return;

      await bridge.checkValidTransaction(mainAccount, transaction);
      if (nonce !== this.nonceTotalSpent) return;

      this.setState(old => {
        if (
          !old.error &&
          old.totalSpent &&
          totalSpent &&
          totalSpent.eq(old.totalSpent)
        ) {
          return null;
        }
        return { totalSpent, error: null };
      });
    } catch (e) {
      if (nonce !== this.nonceTotalSpent) return;

      this.setError(e);
    }
  };

  onAcceptFees = async () => {
    const { account, parentAccount, navigation } = this.props;
    if (!account) return;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    await bridge.checkValidTransaction(mainAccount, transaction);

    navigation.navigate("SendConnectDevice", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
    this.setState({ highFeesOpen: false });
  };

  onRejectFees = () => {
    this.setState({ highFeesOpen: false });
  };

  render() {
    const { totalSpent, error, highFeesOpen } = this.state;
    const { account, parentAccount, navigation } = this.props;
    if (!account) return null;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);
    const amount = bridge.getTransactionAmount(mainAccount, transaction);
    const recipient = bridge.getTransactionRecipient(mainAccount, transaction);

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="SendFunds" name="Summary" />
        <ScrollView style={styles.body}>
          <SummaryFromSection account={account} parentAccount={parentAccount} />
          <VerticalConnector />
          <SummaryToSection recipient={recipient} />
          <SendRowsCustom
            transaction={transaction}
            account={mainAccount}
            navigation={navigation}
          />
          <SectionSeparator lineColor={colors.lightFog} />
          <SummaryAmountSection
            account={account}
            parentAccount={parentAccount}
            amount={amount}
          />
          <SendRowsFee
            account={mainAccount}
            transaction={transaction}
            navigation={navigation}
          />
          <SectionSeparator lineColor={colors.lightFog} />
          <SummaryTotalSection
            account={account}
            parentAccount={parentAccount}
            amount={totalSpent || amount}
          />
        </ScrollView>
        <View style={styles.footer}>
          <LText style={styles.error}>
            <TranslatedError error={error} />
          </LText>
          <Button
            event="SummaryContinue"
            type="primary"
            title={<Trans i18nKey="common.continue" />}
            containerStyle={styles.continueButton}
            onPress={this.onContinue}
            disabled={!totalSpent || !!error}
          />
        </View>
        <ConfirmationModal
          isOpened={highFeesOpen}
          onClose={this.onRejectFees}
          onConfirm={this.onAcceptFees}
          Icon={AlertTriangle}
          confirmationDesc={
            <Trans i18nKey="send.highFeeModal">
              {"text"}
              <LText bold>bold text</LText>
            </Trans>
          }
          confirmButtonText={<Trans i18nKey="common.continue" />}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
  error: {
    color: colors.alert,
    fontSize: 12,
    marginBottom: 5,
  },
  verticalConnector: {
    position: "absolute",
    borderLeftWidth: 2,
    borderColor: colors.lightFog,
    height: 20,
    top: 60,
    left: 16,
  },
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(translate()(SendSummary));

class VerticalConnector extends Component<*> {
  render() {
    return <View style={styles.verticalConnector} />;
  }
}
