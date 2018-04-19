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
  findNodeHandle
} from "react-native";
import { connect } from "react-redux";
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import colors from "../colors";
import Touchable from "../components/Touchable";
import QRCodePreview from "../components/QRCodePreview";
import findFirstTransport from "../hw/findFirstTransport";
import CurrencyDoubleInput from "../components/CurrencyDoubleInput";
import { visibleAccountsSelector } from "../reducers/accounts";
import CurrencyIcon from "../components/CurrencyIcon";
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import HeaderRightClose from "../components/HeaderRightClose";
import LText from "../components/LText";
import ReceiveFundsButton from "../components/ReceiveFundsButton";
import CurrencyRate from "../components/CurrencyRate";

const mapPropsToState = state => ({
  accounts: visibleAccountsSelector(state)
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
    this.syncPublicAddress("44'/0'/0'/0");
  }

  componentWillUnmount() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
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

  onChooseAccount = () => {
    // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
    this.props.navigation.navigate({
      routeName: "ReceiveFundsSelectAccount",
      params: {
        selectedAccountId: this.state.accountId,
        setSelectedAccount: (accountId: string) => {
          this.setState({ accountId, amount: 0 });
        }
      },
      key: "receivefundsselectaccount"
    });
  };

  render() {
    const { accounts } = this.props;
    const { error, amount, accountId } = this.state;
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

        <Touchable onPress={this.onChooseAccount}>
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
                <LText>
                  <CurrencyUnitValue
                    unit={account.unit}
                    value={account.balance}
                    showCode
                  />
                </LText>
              </Fragment>
            ) : (
              <LText style={{ opacity: 0.5 }}>Select an account...</LText>
            )}
          </View>
        </Touchable>
        {account ? (
          <View>
            <Text style={styles.inputTitle}>Request amount (optional)</Text>
            <View style={styles.currencyUnitInput}>
              <CurrencyDoubleInput
                value={amount}
                onChange={this.onChangeAmount}
                currency={account.currency}
                unit={account.unit}
              />
              <LText numberOfLines={1} style={styles.inputTitle}>
                <CurrencyRate currency={account.currency} />
              </LText>
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
    marginBottom: 10,
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
