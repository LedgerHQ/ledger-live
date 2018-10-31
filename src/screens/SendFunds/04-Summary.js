/* @flow */
import React, { Component } from "react";
import { ScrollView, View, SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/live-common/lib/errors";

import { accountScreenSelector } from "../../reducers/accounts";

import Button from "../../components/Button";

import colors from "../../colors";

import SummaryFromSection from "./SummaryFromSection";
import SummaryToSection from "./SummaryToSection";
import SectionSeparator from "./SectionSeparator";
import SummaryAmountSection from "./SummaryAmountSection";
import SendRowsCustom from "../../families/SendRowsCustom";
import SendRowsFee from "../../families/SendRowsFee";
import SummaryTotalSection from "./SummaryTotalSection";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import { getAccountBridge } from "../../bridge";

// TODO put this somewhere
const similarError = (a, b) =>
  a === b || (a && b && a.name === b.name && a.message === b.message);

type Props = {
  account: Account,
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
    notEnoughBalanceError: ?Error,
  },
> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Summary" subtitle="step 4 of 6" />,
  };

  state = {
    totalSpent: null,
    notEnoughBalanceError: null, // TODO use notEnoughBalanceError somewhere!
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
    const { account, navigation } = this.props;
    this.props.navigation.navigate("EditFees", {
      accountId: account.id,
      transaction: navigation.getParam("transaction"),
    });
  };

  onContinue = async () => {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    await bridge.checkValidTransaction(account, transaction);
    navigation.navigate("SendConnectDevice", {
      accountId: account.id,
      transaction,
    });
  };

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

  // React Hooks PLZ. same code as step 3.
  nonceTotalSpent = 0;
  syncTotalSpent = async () => {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const nonce = ++this.nonceTotalSpent;
    try {
      const totalSpent = await bridge.getTotalSpent(account, transaction);
      if (nonce !== this.nonceTotalSpent) return;

      this.setState(old => {
        if (
          !old.notEnoughBalanceError &&
          old.totalSpent &&
          totalSpent &&
          totalSpent.eq(old.totalSpent)
        ) {
          return null;
        }
        return { totalSpent, notEnoughBalanceError: null };
      });
    } catch (e) {
      if (nonce !== this.nonceTotalSpent) return;

      this.setError(e);
    }
  };

  render() {
    const { totalSpent, notEnoughBalanceError } = this.state;
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);
    const recipient = bridge.getTransactionRecipient(account, transaction);

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={6} currentStep={4} />
        <ScrollView style={styles.body}>
          <SummaryFromSection account={account} />
          <SummaryToSection recipient={recipient} />
          <SectionSeparator />
          <SendRowsCustom
            transaction={transaction}
            account={account}
            navigation={navigation}
          />
          <SummaryAmountSection account={account} amount={amount} />
          <SendRowsFee
            account={account}
            transaction={transaction}
            navigation={navigation}
          />
          <SectionSeparator />
          <SummaryTotalSection
            account={account}
            amount={totalSpent || amount}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            type="primary"
            title="Continue"
            containerStyle={styles.continueButton}
            onPress={this.onContinue}
            disabled={!totalSpent && !notEnoughBalanceError}
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
    flexDirection: "column",
  },
  body: {
    flex: 1,
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
});

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(SendSummary);
