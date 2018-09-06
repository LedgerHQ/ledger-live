/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { BigNumber as BigNumberType } from "bignumber.js";

import { accountScreenSelector } from "../../reducers/accounts";

import LText from "../../components/LText";
import BlueButton from "../../components/BlueButton";
import CurrencyIcon from "../../components/CurrencyIcon";
import CounterValue from "../../components/CounterValue";

import colors from "../../colors";

import SummaryRow from "./SummaryRow";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    address: string,
    amount: string,
    amountBigNumber: BigNumberType,
    fees?: number,
  }>,
};

type State = {
  fees: number,
};

class SendSummary extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Summary" subtitle="step 4 of 5" />,
  };

  // FIXME remove the fees state, instead each SummaryRow press should just do a back on the relevant screen

  state = {
    // $FlowFixMe
    fees: this.props.navigation.state.params.fees || 10,
  };

  componentDidUpdate() {
    const {
      navigation: {
        state: {
          // $FlowFixMe
          params: { fees },
        },
      },
    } = this.props;

    if (fees !== this.state.fees) {
      this.setFees(fees);
    }
  }

  setFees = (fees: number) => this.setState({ fees });

  openFees = () => {
    const {
      account,
      navigation: {
        state: {
          // $FlowFixMe
          params: { address, amount, amountBigNumber },
        },
      },
    } = this.props;
    const { fees } = this.state;

    this.props.navigation.navigate("EditFees", {
      accountId: account.id,
      address,
      amount,
      amountBigNumber,
      fees,
    });
  };

  onContinue = () => {
    const { navigation } = this.props;
    navigation.navigate("SendValidation", {
      // $FlowFixMe
      ...navigation.state.params,
    });
  };

  render() {
    const {
      account,
      navigation: {
        state: {
          // $FlowFixMe
          params: { address, amount, amountBigNumber },
        },
      },
    } = this.props;

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={5} currentStep={4} />
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
        <SummaryRow
          title="Address"
          link={`https://some.explorer.com/${address}`} // TODO: change url
        >
          <View style={{ flex: 1 }}>
            <LText
              numberOfLines={2}
              ellipsizeMode="middle"
              style={styles.summaryRowText}
            >
              {address}
            </LText>
          </View>
        </SummaryRow>
        <SummaryRow title="Amount">
          <View style={styles.amountContainer}>
            <LText style={styles.valueText}>
              {`${account.unit.code} ${amount}`}
            </LText>
            <LText style={styles.counterValueText}>
              <CounterValue
                value={amountBigNumber}
                currency={account.currency}
                showCode
              />
            </LText>
          </View>
        </SummaryRow>
        <SummaryRow title="Fees" link="link" last>
          <View style={styles.accountContainer}>
            <LText style={styles.valueText}>{`${
              this.state.fees
            } sat/bytes`}</LText>

            <LText style={styles.link} onPress={this.openFees}>
              Edit
            </LText>
          </View>
        </SummaryRow>
        <View style={styles.summary}>
          <LText semiBold style={styles.summaryValueText}>{`${
            account.unit.code
          } ${amount}`}</LText>
          <LText style={styles.summaryCounterValueText}>
            <CounterValue
              value={amountBigNumber}
              currency={account.currency}
              showCode
            />
          </LText>
          <View style={{ flex: 1 }} />
          <BlueButton
            title="Continue"
            containerStyle={styles.continueButton}
            titleStyle={styles.continueButtonTitle}
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
    height: "auto",
    paddingVertical: 16,
    alignSelf: "stretch",
  },
  continueButtonTitle: {
    fontSize: 16,
    fontFamily: "Museo Sans",
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
