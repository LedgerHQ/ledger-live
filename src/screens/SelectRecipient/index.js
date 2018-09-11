/* @flow */
import React, { Component } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
  Text,
} from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import type { Account } from "@ledgerhq/live-common/lib/types";
import throttle from "lodash/throttle";
import Icon from "react-native-vector-icons/dist/FontAwesome";

import { accountScreenSelector } from "../../reducers/accounts";

import LText from "../../components/LText";
import OutlineButton from "../../components/OutlineButton";
import BlueButton from "../../components/BlueButton";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";

import Close from "../../icons/Close";

import colors from "../../colors";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
};

type State = {
  validAddress: boolean,
  address: string,
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

  state = {
    validAddress: false,
    address: "",
  };

  // $FlowFixMe
  input = React.createRef();

  clear = () => {
    this.input.current.clear();
    this.validateAddress("");
  };

  validateAddress = (text: string): void => {
    if (text) {
      this.setState({ address: text, validAddress: text.length > 10 });
    } else {
      this.setState({ address: "", validAddress: false });
    }
  };

  render() {
    const { address, validAddress } = this.state;
    const { account } = this.props;

    const keyboardVerticalOffset = Platform.OS === "ios" ? 60 : 0;

    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={5} currentStep={2} />
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          enabled
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View style={styles.container}>
            <OutlineButton
              onPress={() => {
                console.log("scan qr code"); // eslint-disable-line no-console
              }}
            >
              <Text>
                <Icon name="qrcode" size={16} color={colors.live} />
              </Text>
              <LText semiBold secondary style={styles.buttonText}>
                Scan QR code
              </LText>
            </OutlineButton>
          </View>
          <View style={styles.container}>
            <LText style={styles.addressTitle}>
              Or enter a recipient address
            </LText>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Address"
                placeholderTextColor={colors.fog}
                style={styles.addressInput}
                onChangeText={this.validateAddress}
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
                This is not a valid address
              </LText>
            ) : null}
          </View>
          <View style={[styles.container, styles.containerFlexEnd]}>
            <BlueButton
              title="Continue"
              onPress={() =>
                this.props.navigation.navigate("SendSelectFunds", {
                  accountId: account.id,
                  address,
                })
              }
              disabled={!validAddress}
              containerStyle={[
                styles.continueButton,
                !validAddress ? styles.disabledContinueButton : null,
              ]}
              titleStyle={[
                styles.continueButtonText,
                !validAddress ? styles.disabledContinueButtonText : null,
              ]}
            />
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  containerFlexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  buttonText: {
    color: colors.live,
    marginLeft: 16,
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

export default connect(mapStateToProps)(SelectRecipient);
