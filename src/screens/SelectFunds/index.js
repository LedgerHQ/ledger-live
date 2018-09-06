/* @flow */
import React, { Component } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { connect } from "react-redux";
import { BigNumber } from "bignumber.js";
import { valueFromUnit } from "@ledgerhq/live-common/lib/helpers/currencies/valueFromUnit";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { BigNumber as BigNumberType } from "bignumber.js";

import { accountScreenSelector } from "../../reducers/accounts";

import colors from "../../colors";

import LText from "./../../components/LText/index";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import OutlineButton from "../../components/OutlineButton";
import BlueButton from "../../components/BlueButton";

import AmountInput from "./AmountInput";
import CounterValuesSeparator from "./CounterValuesSeparator";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    address: string,
  }>,
};

type State = {
  amount: string,
  amountBigNumber: BigNumberType,
};

class SelectFunds extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Amount" subtitle="step 3 of 5" />,
  };

  state = {
    amount: "",
    amountBigNumber: new BigNumber(0),
  };

  onChangeText = (amount: string) => {
    if (amount && !isNaN(amount)) {
      const { account } = this.props;
      const num = new BigNumber(parseFloat(amount));
      const big = valueFromUnit(num, account.unit);
      this.setState({
        amount,
        amountBigNumber: big,
      });
    }
  };

  navigate = () => {
    const {
      account,
      navigation: {
        state: {
          // $FlowFixMe
          params: { address },
        },
      },
    } = this.props;
    const { amount, amountBigNumber } = this.state;
    this.props.navigation.navigate("SendSummary", {
      accountId: account.id,
      address,
      amount,
      // FIXME we shouldn't pass amountBigNumber because not serializable, also want to avoid derivated data
      amountBigNumber,
    });
  };

  render() {
    const { account } = this.props;
    const { amount, amountBigNumber } = this.state;

    const isWithinBalance = amountBigNumber.lt(account.balance);
    const isValid = amountBigNumber.gt(0) && isWithinBalance;

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={5} currentStep={3} />
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          enabled
        >
          <AmountInput
            onChangeText={this.onChangeText}
            currency={account.unit.code}
            value={amount}
            isWithinBalance={isWithinBalance}
          />
          <CounterValuesSeparator />
          <View style={styles.countervaluesWrapper}>
            <LText tertiary style={styles.countervaluesText}>
              <CounterValue
                showCode
                currency={account.currency}
                value={amountBigNumber}
              />
            </LText>
          </View>
          <View style={styles.bottomWrapper}>
            <OutlineButton
              outlineColor={colors.live}
              containerStyle={styles.useMaxButton}
              onPress={() => {
                console.log("max"); // eslint-disable-line no-console
              }}
              hitSlop={{ top: 10, bottom: 10, left: 0, right: 0 }}
            >
              <LText bold style={styles.useMaxText}>
                USE MAX
              </LText>
            </OutlineButton>
            <LText style={styles.available}>
              Available : &nbsp;
              <CurrencyUnitValue
                showCode
                unit={account.unit}
                value={account.balance}
              />
            </LText>
            <View style={styles.continueWrapper}>
              <BlueButton
                title="Continue"
                onPress={this.navigate}
                disabled={!isValid}
                containerStyle={[
                  styles.continueButton,
                  !isValid ? styles.disabledContinueButton : null,
                ]}
                titleStyle={[
                  styles.continueButtonText,
                  !isValid ? styles.disabledContinueButtonText : null,
                ]}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    alignItems: "flex-start",
  },
  available: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 10,
  },
  useMaxButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  useMaxText: {
    fontSize: 10,
    color: colors.live,
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
  },
  continueWrapper: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  continueButton: {
    paddingVertical: 16,
    height: "auto",
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: "Museo Sans",
  },
  disabledContinueButton: {
    backgroundColor: colors.lightFog,
  },
  disabledContinueButtonText: {
    color: colors.grey,
  },
});

const mapStateToProps = (state, props: Props): { account: Account } => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(SelectFunds);
