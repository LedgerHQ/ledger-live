/* @flow */
import React, { Component } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
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

import { getAccountBridge } from "../../bridge/index";

import LText from "../../components/LText";
import Button from "../../components/Button";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";

import Close from "../../icons/Close";

import colors from "../../colors";
import TranslatedError from "../../components/TranslatedError";

type Props = {
  t: T,
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    result: string,
  }>,
};

type State = {
  validAddress: boolean,
  address: string,
  error: ?Error,
  shouldUpdate: boolean,
};

class SelectRecipient extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader title="Recipient address" subtitle="step 2 of 5" />
    ),
  };

  constructor(props: *) {
    super(props);

    this.validateAddress = throttle(this.validateAddress, 200);
  }

  componentDidUpdate(_, { address: prevAddress }) {
    const { navigation } = this.props;
    const { shouldUpdate } = this.state;
    const qrResult = navigation.getParam("result");
    if (!shouldUpdate && qrResult && prevAddress !== qrResult) {
      this.onChangeText(qrResult, false);
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
    this.validateAddress("");
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
      if (!res) return this.setState({ validAddress: true, error: null });

      return this.setState({ validAddress: false, error: res });
    } catch (e) {
      return this.setState({ validAddress: false, error: e });
    }
  };

  render() {
    const { address, validAddress, error } = this.state;
    const { account, t } = this.props;

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={5} currentStep={2} />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.container}>
            <Button
              type="tertiary"
              title={t("common:send.recipient.scan")}
              IconLeft={IconQRCode}
              onPress={() =>
                // $FlowFixMe
                this.props.navigation.replace("ScanRecipient", {
                  accountId: this.props.navigation.getParam("accountId"),
                })
              }
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
              {address ? (
                <TouchableOpacity onPress={this.clear}>
                  <View style={styles.closeContainer}>
                    <Close color={colors.white} size={8} />
                  </View>
                </TouchableOpacity>
              ) : null}
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
              onPress={() =>
                this.props.navigation.navigate("SendSelectFunds", {
                  accountId: account.id,
                  address,
                })
              }
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
