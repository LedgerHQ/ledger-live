/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { compose } from "redux";
import i18next from "i18next";
import { translate, Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import throttle from "lodash/throttle";
import Icon from "react-native-vector-icons/dist/FontAwesome";

import type { T } from "../../types/common";

import { accountScreenSelector } from "../../reducers/accounts";
import { getAccountBridge } from "../../bridge";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import TranslatedError from "../../components/TranslatedError";
import InputResetCross from "../../components/InputResetCross";
import TextInput from "../../components/TextInput";
import SyncSkipUnderPriority from "../../bridge/SyncSkipUnderPriority";
import SyncOneAccountOnMount from "../../bridge/SyncOneAccountOnMount";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: *,
    },
  }>,
  t: T,
};

type State = {
  addressStatus: string,
  address: *,
  error: ?Error,
  shouldUpdate: boolean,
};

class SendSelectRecipient extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("send.stepperHeader.recipientAddress")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "2",
          totalSteps: "6",
        })}
      />
    ),
  };

  constructor() {
    super();
    this.validateAddress = throttle(this.validateAddress, 200);
  }

  unmounted = false;

  preloadedNetworkInfo: ?Object;

  componentDidMount() {
    const { account } = this.props;
    const bridge = getAccountBridge(account);
    bridge.fetchTransactionNetworkInfo(account).then(
      networkInfo => {
        this.preloadedNetworkInfo = networkInfo;
      },
      () => {
        // error not handled here
      },
    );
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
    addressStatus: "pending",
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
      if (!res) this.setState({ addressStatus: "valid", error: null });
      else this.setState({ addressStatus: "warning", error: res });
    } catch (e) {
      this.setState({
        addressStatus: "invalid",
        error: e,
      });
    }
  };

  onPressScan = () => {
    const { navigation } = this.props;
    navigation.navigate("ScanRecipient", {
      accountId: navigation.getParam("accountId"),
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

    if (this.preloadedNetworkInfo) {
      transaction = bridge.applyTransactionNetworkInfo(
        account,
        transaction,
        this.preloadedNetworkInfo,
      );
    }

    navigation.navigate("SendAmount", {
      accountId: account.id,
      transaction,
    });
  };

  render() {
    const { address, error, addressStatus } = this.state;
    const { account, t } = this.props;
    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="SendFunds" name="SelectRecipient" />
        <SyncSkipUnderPriority priority={100} />
        <SyncOneAccountOnMount priority={100} accountId={account.id} />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.container}>
            <Button
              event="SendRecipientQR"
              type="tertiary"
              title={<Trans i18nKey="send.recipient.scan" />}
              IconLeft={IconQRCode}
              onPress={this.onPressScan}
            />
          </View>
          <View style={styles.container}>
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <LText style={styles.separatorText}>
                {<Trans i18nKey="common.or" />}
              </LText>
              <View style={styles.separatorLine} />
            </View>
            <View style={styles.inputWrapper}>
              {/* make this a recipient component */}
              <TextInput
                placeholder={t("send.recipient.input")}
                placeholderTextColor={colors.fog}
                style={[
                  styles.addressInput,
                  addressStatus === "invalid" && styles.invalidAddressInput,
                  addressStatus === "warning" && styles.warning,
                ]}
                onChangeText={this.onChangeText}
                value={address}
                ref={this.input}
                multiline
                blurOnSubmit
                autoCapitalize="none"
              />
              {address ? <InputResetCross onPress={this.clear} /> : null}
            </View>
            {!!address &&
              addressStatus !== "valid" && (
                <LText
                  style={[
                    styles.warningBox,
                    addressStatus === "invalid" ? styles.error : styles.warning,
                  ]}
                >
                  <TranslatedError error={error} />
                </LText>
              )}
          </View>
          <View style={[styles.container, styles.containerFlexEnd]}>
            <Button
              event="SendRecipientContinue"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              onPress={this.onPressContinue}
              disabled={
                addressStatus === "invalid" || addressStatus === "pending"
              }
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
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  separatorLine: {
    flex: 1,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
    marginHorizontal: 8,
  },
  separatorText: {
    color: colors.grey,
  },
  containerFlexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  addressTitle: {
    color: colors.grey,
    marginBottom: 6,
  },
  addressInput: {
    flex: 1,
    fontSize: 20,
    marginTop: 16,
    color: colors.darkBlue,
  },
  invalidAddressInput: {
    color: colors.alert,
  },
  warning: {
    color: colors.orange,
  },
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  error: {
    color: colors.alert,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
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
)(SendSelectRecipient);
