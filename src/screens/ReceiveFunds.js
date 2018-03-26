/* @flow */
import React, { Component, Fragment } from "react";
import AppBtc from "@ledgerhq/hw-app-btc";
import {
  View,
  ScrollView,
  Text,
  Share,
  Clipboard,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  findNodeHandle
} from "react-native";
import { connect } from "react-redux";
import { getCurrencyByCoinType, getFiatUnit } from "@ledgerhq/currencies";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import colors from "../colors";
import QRCodePreview from "../components/QRCodePreview";
import findFirstTransport from "../hw/findFirstTransport";
import CurrencyUnitInput from "../components/CurrencyUnitInput";
import { getVisibleAccounts } from "../reducers/accounts";
import CurrencyIcon from "../components/CurrencyIcon";
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import HeaderRightClose from "../components/HeaderRightClose";
import LText from "../components/LText";
import ReceiveFundsButton from "../components/ReceiveFundsButton";

const mapPropsToState = state => ({
  accounts: getVisibleAccounts(state)
});

class ReceiveFunds extends Component<
  {
    navigation: NavigationScreenProp<*>,
    accounts: Account[]
  },
  *
> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Receive Funds",
    headerLeft: <HeaderRightClose navigation={screenProps.topLevelNavigation} />
  });

  state = {
    address: undefined,
    currency: getCurrencyByCoinType(0),
    countervalue: undefined,
    error: undefined,
    accountId:
      this.props.accounts.length > 0 ? this.props.accounts[0].id : null,
    amount: 0
  };
  viewHandle: ?*;
  onRef = (ref: *) => {
    this.viewHandle = findNodeHandle(ref);
  };

  subs = [];

  componentDidMount() {
    const account = this.props.accounts.find(
      a => a.id === this.state.accountId
    );
    // TODO implement getDerivedStateFromProps to handle the navigation state
    /*
    const { params } = this.props.navigation.state;
    let amount = 0;
    if (params.amount) {
      amount = parseFloat(params.amount);
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        amount = 0;
      }
    }
    this.setState({ amount });
    */
    if (account && account.unit) {
      this.syncCountervalue(account.unit.code);
    }
    this.syncPublicAddress("44'/0'/0'/0");
  }

  componentWillUnmount() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  async syncCountervalue(unit) {
    const r = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${unit}&tsyms=USD`
    );
    const countervalue = await r.json();
    this.setState({ countervalue });
  }

  syncPublicAddress(path: string, verify: boolean = false) {
    this.addSub(
      findFirstTransport().subscribe(
        async transport => {
          try {
            transport.setDebugMode(true);
            const btc = new AppBtc(transport);
            const { bitcoinAddress } = await btc.getWalletPublicKey(
              path,
              verify
            );
            this.setState({ address: bitcoinAddress });
          } catch (error) {
            this.setState({ error });
          }
        },
        error => {
          this.setState({ error });
        }
      )
    );
  }

  addSub = (sub: *) => {
    this.subs.push(sub);
  };

  onShare = () => {
    const { address, amount } = this.state;
    if (!address) return;
    const currencySymbol = "BTC";
    const link = `bitcoin:${address}`; // TODO needs formatter
    Share.share({
      title: `Send me ${amount ? `${amount} ` : ""}${currencySymbol}`,
      message: link
    });
  };

  onVerify = () => {
    this.syncPublicAddress("44'/0'/0'/0", true);
  };

  onCopy = () => {
    const { address } = this.state;
    if (address) Clipboard.setString(address);
  };

  onChangeAmount = (value: number) => {
    this.setState({ amount: value });
  };

  onChangeCountervalueAmount = (value: number) => {
    this.setState(({ countervalue }) => {
      if (!countervalue) return null;
      return {
        amount: Math.round(value / countervalue.USD)
      };
    });
  };

  onChooseAccount = () => {
    this.props.navigation.navigate("ReceiveFundsSelectAccount", {
      selectedAccountId: this.state.accountId,
      setSelectedAccount: (accountId, unit) => {
        this.setState({ accountId, countervalue: null, amount: 0 });
        this.syncCountervalue(unit);
      }
    });
  };

  render() {
    const { accounts } = this.props;
    const { error, amount, countervalue, accountId } = this.state;
    const countervalueUnit = getFiatUnit("USD");
    const account = accounts.find(a => a.id === accountId);
    const address = account && account.address;
    const currency = account && account.currency;
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        ref={this.onRef}
        bounces={false}
      >
        <Text style={styles.inputTitle} semiBold>
          Choose account
        </Text>

        <TouchableOpacity onPress={this.onChooseAccount}>
          <View style={styles.choseAccountInput}>
            {account ? (
              <Fragment>
                <CurrencyIcon currency={account.currency} size={32} />
                <LText
                  numberOfLines={1}
                  semiBold
                  style={{ marginHorizontal: 10, flex: 1 }}
                >
                  {account.name}
                </LText>
                <CurrencyUnitValue
                  unit={account.unit}
                  value={account.balance}
                  showCode
                />
              </Fragment>
            ) : (
              <LText style={{ opacity: 0.5 }}>Select an account...</LText>
            )}
          </View>
        </TouchableOpacity>
        {account ? (
          <View>
            <Text style={styles.inputTitle}>Request amount (optional)</Text>
            <View style={styles.currencyUnitInput}>
              <CurrencyUnitInput
                value={amount}
                unit={account.unit}
                onChange={this.onChangeAmount}
                width={140}
                height={50}
                fontSize={14}
                padding={8}
              />
              {countervalue ? (
                <CurrencyUnitInput
                  value={Math.round(
                    amount * countervalue[countervalueUnit.code]
                  )}
                  onChange={this.onChangeCountervalueAmount}
                  unit={countervalueUnit}
                  width={140}
                  height={50}
                  fontSize={14}
                  padding={8}
                />
              ) : null}
            </View>
          </View>
        ) : null}
        {error ? (
          <Text style={{ color: "white" }}>{String(error)}</Text>
        ) : !address ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.content}>
            <QRCodePreview
              address={address}
              currency={currency}
              amount={amount}
              size={220}
              useURIScheme
            />
            <Text style={styles.addressTitle}>Current address</Text>
            <View style={styles.addressBox}>
              <Text style={{ color: "white" }}>{address}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <ReceiveFundsButton title="Share" onPress={this.onShare} />
              <ReceiveFundsButton title="Copy" onPress={this.onCopy} />
              <ReceiveFundsButton title="Verify" onPress={this.onVerify} />
            </View>
          </View>
        )}
      </ScrollView>
    );
  }
}

export default connect(mapPropsToState)(ReceiveFunds);

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.blue,
    flex: 1
  },
  content: {
    justifyContent: "center",
    paddingHorizontal: 20
  },
  inputTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10
  },
  choseAccountInput: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center"
  },
  currencyUnitInput: {
    height: 50,
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch"
  },
  addressBox: {
    padding: 10,
    margin: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "white",
    borderStyle: "dashed"
  },
  addressTitle: {
    color: "white",
    fontWeight: "bold",
    marginTop: 30,
    marginLeft: 10
  }
});
