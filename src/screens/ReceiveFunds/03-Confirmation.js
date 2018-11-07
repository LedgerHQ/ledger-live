// @flow

import React, { Component } from "react";
import { SafeAreaView, View, StyleSheet, Dimensions } from "react-native";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";

import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { open } from "../../logic/hw";

import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText/index";
import DisplayAddress from "../../components/DisplayAddress";
import VerifyAddressDisclaimer from "../../components/VerifyAddressDisclaimer";
import BottomModal from "../../components/BottomModal";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import Close from "../../icons/Close";
import Touchable from "../../components/Touchable";
import TranslatedError from "../../components/TranslatedError";
import Button from "../../components/Button";

type Navigation = NavigationScreenProp<{
  params: {
    accountId: string,
    deviceId: string,
  },
}>;

type Props = {
  account: Account,
  navigation: Navigation,
};

type State = {
  verified: boolean,
  isModalOpened: boolean,
  onModalHide: Function,
  error: ?Error,
};

class ReceiveConfirmation extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Receive" subtitle="3 of 3" />,
  };

  state = {
    verified: false,
    isModalOpened: false,
    onModalHide: () => {},
    error: null,
  };

  componentDidMount() {
    const deviceId = this.props.navigation.getParam("deviceId");
    if (deviceId) this.verifyOnDevice(deviceId);
  }

  verifyOnDevice = async (deviceId: string) => {
    const { account } = this.props;

    const transport = await open(deviceId);
    try {
      await getAddress(
        transport,
        account.currency,
        account.freshAddressPath,
        true,
      );
      this.setState({ verified: true });
    } catch (error) {
      this.setState({ error, isModalOpened: true });
    }
    await transport.close();
  };

  onRetry = () => {
    this.setState({
      isModalOpened: false,
      onModalHide: this.props.navigation.goBack,
    });
  };

  onModalClose = () => {
    this.setState({
      isModalOpened: false,
      onModalHide: this.onDone,
    });
  };

  onDone = () => {
    if (this.props.navigation.dismiss) {
      this.props.navigation.dismiss();
    }
  };

  render(): React$Node {
    const { account, navigation } = this.props;
    const { verified, error, isModalOpened, onModalHide } = this.state;
    const { width } = Dimensions.get("window");
    const unsafe = !navigation.getParam("deviceId");

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={3} currentStep={3} />
        <View style={styles.container}>
          <View style={styles.qrWrapper}>
            <QRCode size={width / 2 - 30} value={account.freshAddress} />
          </View>
          <View>
            <LText style={styles.addressTitle}>Address for account</LText>
          </View>
          <View>
            <LText semiBold style={styles.addressTitleBold}>
              {account.name}
            </LText>
          </View>
          <View style={styles.address}>
            <DisplayAddress address={account.freshAddress} />
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <VerifyAddressDisclaimer
            unsafe={unsafe}
            verified={verified}
            text={
              unsafe ? (
                <Trans
                  i18nKey="transfer.receive.verifySkipped"
                  values={{
                    accountType: account.currency.managerAppName,
                  }}
                />
              ) : verified ? (
                <Trans i18nKey="transfer.receive.verified" />
              ) : (
                <Trans
                  i18nKey="transfer.receive.verifyPending"
                  values={{
                    accountType: account.currency.managerAppName,
                  }}
                />
              )
            }
          />
        </View>
        {verified && (
          <View style={styles.footer}>
            <Button
              containerStyle={styles.button}
              onPress={this.onDone}
              type="secondary"
              title={<Trans i18nKey="common.done" />}
            />
            <Button
              containerStyle={styles.button}
              type="primary"
              title={<Trans i18nKey="transfer.receive.verifyAgain" />}
              onPress={this.onRetry}
            />
          </View>
        )}
        <BottomModal isOpened={isModalOpened} onModalHide={onModalHide}>
          {error ? (
            <View style={styles.modal}>
              <View style={styles.modalBody}>
                <View style={styles.modalIcon}>
                  <DeviceNanoAction error={error} />
                </View>
                <LText secondary semiBold style={styles.modalTitle}>
                  <TranslatedError error={error} />
                </LText>
                <LText style={styles.modalDescription}>
                  <TranslatedError error={error} field="description" />
                </LText>
              </View>
              <View style={styles.buttonsContainer}>
                <Button
                  type="secondary"
                  title={<Trans i18nKey="common.contactUs" />}
                  containerStyle={styles.button}
                  onPress={() => {}} // TODO do something
                />
                <Button
                  type="primary"
                  title={<Trans i18nKey="common.retry" />}
                  containerStyle={styles.button}
                  onPress={this.onRetry}
                />
              </View>
            </View>
          ) : null}
          <Touchable style={styles.close} onPress={this.onModalClose}>
            <Close color={colors.fog} size={20} />
          </Touchable>
        </BottomModal>
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
    paddingTop: 24,
    alignItems: "center",
  },
  bottomContainer: {
    padding: 16,
  },
  qrWrapper: {
    borderWidth: 1,
    borderColor: colors.lightFog,
    padding: 15,
    borderRadius: 4,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: 4,
    },
  },
  addressTitle: {
    paddingTop: 24,
    fontSize: 14,
    color: colors.grey,
  },
  addressTitleBold: {
    paddingTop: 4,
    fontSize: 16,
    color: colors.darkBlue,
  },
  address: {
    paddingTop: 25,
  },
  modal: {
    flexDirection: "column",
    minHeight: 350,
  },
  modalBody: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalIcon: {
    paddingTop: 60,
  },
  modalTitle: {
    paddingTop: 40,
    fontSize: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
  modalDescription: {
    paddingTop: 16,
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "flex-end",
    flexGrow: 1,
  },
  button: {
    flexGrow: 1,
    marginHorizontal: 8,
  },
  footer: {
    flexDirection: "row",
    marginBottom: 16,
    marginHorizontal: 8,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(translate()(ReceiveConfirmation));
