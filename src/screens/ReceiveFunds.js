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
import colors from "../colors";
import QRCodePreview from "../components/QRCodePreview";
import findFirstTransport from "../hw/findFirstTransport";
import CurrencyUnitInput from "../components/CurrencyUnitInput";
import { getVisibleAccounts } from "../reducers/accounts";
import type { Account } from "../types/common";
import CurrencyIcon from "../components/CurrencyIcon";
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import HeaderRightClose from "../components/HeaderRightClose";
import LText from "../components/LText";

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.blue,
    flex: 1
  },
  content: {
    justifyContent: "center",
    padding: 20
  }
});

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
    this.syncCountervalue();
    this.syncPublicAddress("44'/0'/0'/0");
  }

  componentWillUnmount() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  async syncCountervalue() {
    const r = await fetch(
      "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD"
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
    const usdUnit = getFiatUnit("USD");
    this.setState(({ countervalue, currency }) => {
      if (!countervalue) return null;
      return {
        amount: Math.round(
          value /
            (countervalue.USD * 10 ** usdUnit.magnitude) *
            10 ** currency.units[0].magnitude
        )
      };
    });
  };

  onChooseAccount = () => {
    this.props.navigation.navigate("ReceiveFundsSelectAccount", {
      selectedAccountId: this.state.accountId,
      setAccountId: accountId => this.setState({ accountId })
    });
  };

  render() {
    const { accounts } = this.props;
    const {
      address,
      error,
      amount,
      currency,
      countervalue,
      accountId
    } = this.state;
    const countervalueUnit = getFiatUnit("USD");
    const account = accounts.find(a => a.id === accountId);
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        ref={this.onRef}
        bounces={false}
      >
        <Text style={{ color: "white", fontWeight: "bold", margin: 10 }}>
          Choose account
        </Text>

        <TouchableOpacity onPress={this.onChooseAccount}>
          <View
            style={{
              padding: 16,
              marginBottom: 10,
              backgroundColor: "white",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            {account ? (
              <Fragment>
                <CurrencyIcon currency={account.currency} size={32} />
                <LText semiBold style={{ marginHorizontal: 10, flex: 1 }}>
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

        <Text style={{ color: "white", fontWeight: "bold", margin: 10 }}>
          Request amount (optional)
        </Text>

        <View
          style={{
            height: 50,
            marginBottom: 40,
            flexDirection: "row",
            justifyContent: "space-between",
            alignSelf: "stretch"
          }}
        >
          <CurrencyUnitInput
            value={amount}
            unit={currency.units[0]}
            onChange={this.onChangeAmount}
            width={130}
            height={50}
            fontSize={14}
            padding={8}
          />
          {countervalue ? (
            <CurrencyUnitInput
              value={Math.round(
                amount *
                  countervalue[countervalueUnit.code] *
                  10 **
                    (countervalueUnit.magnitude - currency.units[0].magnitude)
              )}
              onChange={this.onChangeCountervalueAmount}
              unit={countervalueUnit}
              width={130}
              height={50}
              fontSize={14}
              padding={8}
            />
          ) : null}
        </View>

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

            <View />

            <Text style={{ color: "white", fontWeight: "bold", marginTop: 30 }}>
              Current address
            </Text>
            <View
              style={{
                // FIXME this should be a component
                padding: 10,
                margin: 10,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: "white",
                borderStyle: "dashed"
              }}
            >
              <Text style={{ color: "white" }}>{address}</Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity onPress={this.onShare}>
                <View
                  style={{
                    width: 80,
                    height: 40,
                    margin: 10,
                    backgroundColor: "white",
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text>Share</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.onCopy}>
                <View
                  style={{
                    width: 80,
                    height: 40,
                    margin: 10,
                    backgroundColor: "white",
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text>Copy</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.onVerify}>
                <View
                  style={{
                    width: 80,
                    height: 40,
                    margin: 10,
                    backgroundColor: "white",
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text>Verify</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }
}

export default connect(mapPropsToState)(ReceiveFunds);
