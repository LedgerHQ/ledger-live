/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import LText from "../../components/LText";
import Button from "../../components/Button";
import CurrencyIcon from "../../components/CurrencyIcon";
import CounterValue from "../../components/CounterValue";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

import colors from "../../colors";

import SummaryRow from "./SummaryRow";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import { getAccountBridge } from "../../bridge";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: *,
    },
  }>,
};

class SendSummary extends Component<Props> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Summary" subtitle="step 4 of 6" />,
  };

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

  render() {
    const { account, navigation } = this.props;
    const transaction = navigation.getParam("transaction");
    const bridge = getAccountBridge(account);
    const amount = bridge.getTransactionAmount(account, transaction);
    const recipient = bridge.getTransactionRecipient(account, transaction);

    // TODO when integrating new design: one row = one component !!

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={6} currentStep={4} />
        <SummaryRow title="Account">
          <View style={styles.accountContainer}>
            <View style={{ paddingRight: 8 }}>
              <CurrencyIcon size={16} currency={account.currency} />
            </View>
            <LText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.summaryRowText}
            >
              {account.name}
            </LText>
          </View>
        </SummaryRow>
        <SummaryRow title="Address">
          <View style={{ flex: 1 }}>
            <LText
              numberOfLines={2}
              ellipsizeMode="middle"
              style={styles.summaryRowText}
            >
              {recipient}
            </LText>
          </View>
        </SummaryRow>
        <SummaryRow title="Amount">
          <View style={styles.amountContainer}>
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={account.unit} value={amount} />
            </LText>
            <LText style={styles.counterValueText}>
              <CounterValue
                value={amount}
                currency={account.currency}
                showCode
              />
            </LText>
          </View>
        </SummaryRow>

        {/* FIXME rendering of this will be branched with one component per family of coin */}
        <SummaryRow title="Fees" link="link" last>
          <View style={styles.accountContainer}>
            <LText style={styles.valueText}>{`${bridge.getTransactionExtra(
              account,
              transaction,
              "feePerByte",
            ) || "?"} sat/bytes`}</LText>

            <LText style={styles.link} onPress={this.openFees}>
              Edit
            </LText>
          </View>
        </SummaryRow>

        <View style={styles.summary}>
          <LText semiBold style={styles.summaryValueText}>
            <CurrencyUnitValue unit={account.unit} value={amount} />
          </LText>
          <LText style={styles.summaryCounterValueText}>
            <CounterValue value={amount} currency={account.currency} showCode />
          </LText>
          <View style={{ flex: 1 }} />
          <Button
            type="primary"
            title="Continue"
            containerStyle={styles.continueButton}
            onPress={this.onContinue}
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
  accountContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
    color: colors.darkBlue,
  },
  amountContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 16,
  },
  counterValueText: {
    fontSize: 12,
    color: colors.grey,
  },
  summary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    borderTopColor: colors.lightFog,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  summaryValueText: {
    fontSize: 20,
    color: colors.live,
  },
  summaryCounterValueText: {
    fontSize: 14,
    color: colors.grey,
  },
  continueButton: {
    alignSelf: "stretch",
  },
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
});

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(SendSummary);
