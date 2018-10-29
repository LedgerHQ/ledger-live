/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet, TextInput } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import throttle from "lodash/throttle";
import Icon from "react-native-vector-icons/dist/FontAwesome";

import type { T } from "../../types/common";

import { accountScreenSelector } from "../../reducers/accounts";

import { getAccountBridge } from "../../bridge";

import LText from "../../components/LText";
import Button from "../../components/Button";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import TranslatedError from "../../components/TranslatedError";
import InputResetCross from "../../components/InputResetCross";

import colors from "../../colors";

type Props = {
  t: T,
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    transaction: *,
  }>,
};

type State = {
  validAddress: boolean,
  address: *,
  error: ?Error,
  shouldUpdate: boolean,
};

class SelectRecipient extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader title="Recipient address" subtitle="step 2 of 6" />
    ),
  };

  constructor() {
    super();
    this.validateAddress = throttle(this.validateAddress, 200);
  }

  unmounted = false;

  transactionNetworkInfo: Promise<*>;

  componentDidMount() {
    const { account } = this.props;
    const bridge = getAccountBridge(account);
    this.transactionNetworkInfo = bridge.fetchTransactionNetworkInfo(account);
  }

  componentWillUnmount() {
    this.validateAddress.cancel();
    this.unmounted = true;
  }

  componentDidUpdate(_, { address: prevAddress }) {
    // FIXME we should refactor this in a more elegant way
    const { navigation, account } = this.props;
    const { shouldUpdate } = this.state;
    if (!shouldUpdate) {
      const transaction = navigation.getParam("transaction");
      if (transaction) {
        const bridge = getAccountBridge(account);
        const address = bridge.getTransactionRecipient(account, transaction);
        if (address && prevAddress !== address) {
          this.onChangeText(address, false);
        }
      }
    }
  }

  state = {
    validAddress: false,
    address: "",
    error: null,
    shouldUpdate: false,
  };

  input = React.createRef();

  clear = () => {
    if (this.input.current) {
      this.input.current.clear();
    }
    this.onChangeText("");
  };

  onChangeText = (address: string, shouldUpdate = true) => {
    this.setState({ address, shouldUpdate });
    this.validateAddress(address);
  };

  validateAddress = async (address: string) => {
    const { account } = this.props;
    const bridge = getAccountBridge(account);
    try {
      const res = await bridge.checkValidRecipient(account.currency, address);
      if (this.unmounted) return;
      if (!res) this.setState({ validAddress: true, error: null });
      else this.setState({ validAddress: false, error: res });
    } catch (e) {
      this.setState({ validAddress: false, error: e });
    }
  };

  onPressScan = () => {
    this.props.navigation.navigate("ScanRecipient", {
      accountId: this.props.navigation.getParam("accountId"),
    });
  };

  onPressContinue = async () => {
    const { account, navigation } = this.props;
    const { address } = this.state;
    const bridge = getAccountBridge(account);
    let transaction =
      navigation.getParam("transaction") || bridge.createTransaction(account);

    transaction = bridge.editTransactionRecipient(
      account,
      transaction,
      address,
    );

    try {
      const networkInfo = await this.transactionNetworkInfo;
      // FIXME race with a timeout
      transaction = bridge.applyTransactionNetworkInfo(
        account,
        transaction,
        networkInfo,
      );
    } catch (e) {
      console.warn(e);
    }

    if (this.unmounted) return;

    navigation.navigate("SendAmount", {
      accountId: account.id,
      transaction,
    });
  };

  render() {
    const { address, validAddress, error } = this.state;
    const { t } = this.props;

    return (
      <SafeAreaView style={styles.root}>
        <Stepper currentStep={2} nbSteps={6} />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.container}>
            <Button
              type="tertiary"
              title={t("common:send.recipient.scan")}
              IconLeft={IconQRCode}
              onPress={this.onPressScan}
            />
          </View>
          <View style={styles.container}>
            <LText style={styles.addressTitle}>
              {t("common:send.recipient.enterAddress")}
            </LText>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder={t("common:send.recipient.input")}
                placeholderTextColor={colors.fog}
                style={[
                  styles.addressInput,
                  !validAddress ? styles.invalidAddressInput : null,
                ]}
                onChangeText={this.onChangeText}
                value={address}
                ref={this.input}
                multiline
                blurOnSubmit
              />
              {address ? <InputResetCross onPress={this.clear} /> : null}
            </View>
            {!!address && !validAddress ? (
              <LText style={styles.errorText}>
                <TranslatedError error={error} />
              </LText>
            ) : null}
          </View>
          <View style={[styles.container, styles.containerFlexEnd]}>
            <Button
              type="primary"
              title="Continue"
              onPress={this.onPressContinue}
              disabled={!validAddress}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const IconQRCode = ({ size, color }: { size: number, color: string }) => (
  <Icon name="qrcode" size={size} color={color} />
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  containerFlexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  addressTitle: {
    color: colors.grey,
    fontSize: 12,
    marginBottom: 6,
  },
  addressInput: {
    flex: 1,
    fontSize: 24,
    color: colors.darkBlue,
  },
  invalidAddressInput: {
    color: colors.alert,
  },
  errorText: {
    color: colors.alert,
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  closeContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: colors.fog,
    marginLeft: 6,
    marginBottom: 6,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default compose(
  translate(),
  connect(mapStateToProps),
)(SelectRecipient);
