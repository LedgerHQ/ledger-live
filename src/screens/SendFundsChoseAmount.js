// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { ScrollView, StyleSheet, KeyboardAvoidingView } from "react-native";
import { Account } from "@ledgerhq/wallet-common";
import CurrencyDoubleInput from "../components/CurrencyDoubleInput";
import BlueButton from "../components/BlueButton";
import HeaderRightText from "../components/HeaderRightText";
import { accountByIdSelector } from "../reducers/accounts";

type Props = {
  navigation: *,
  accountByIdSelector: string => ?Account
};
type State = {
  amount: number,
  account: ?Account
};

const mapStateToProps = state => ({
  accountByIdSelector: id => accountByIdSelector(state, id)
});

class SendFundsChoseAmount extends Component<Props, State> {
  static navigationOptions = {
    title: "Chose amount",
    headerRight: <HeaderRightText>3 of 5</HeaderRightText>
  };

  state = {
    amount: this.props.navigation.state.params.amount || 0,
    account: null
  };

  static getDerivedStateFromProps(
    nextProps: Props,
    prevState: State
  ): $Shape<State> {
    let state = null;
    if (!prevState.account) {
      state = {
        ...state,
        account: nextProps.accountByIdSelector(
          nextProps.navigation.state.params.accountId
        )
      };
    }
    return state;
  }

  onChangeAmount = (amount: number) => {
    this.setState({ amount });
  };

  onConfirm = () => {
    const { navigation } = this.props;
    const { amount } = this.state;
    navigation.navigate(
      "SendFundsChoseFee",
      {
        ...navigation.state.params,
        amount
      },
      {
        key: "sendfundschosefee"
      }
    );
  };

  render() {
    const { amount, account } = this.state;
    if (!account) return null;
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.root}
        keyboardVerticalOffset={65}
      >
        <ScrollView style={styles.body}>
          <CurrencyDoubleInput
            value={amount}
            onChange={this.onChangeAmount}
            currency={account.currency}
            unit={account.unit}
          />
        </ScrollView>
        <BlueButton title="Confirm amount" onPress={this.onConfirm} />
      </KeyboardAvoidingView>
    );
  }
}

export default connect(mapStateToProps)(SendFundsChoseAmount);

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  body: {
    flex: 1,
    padding: 10
  }
});
