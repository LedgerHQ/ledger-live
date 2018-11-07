// @flow

import React, { Component, PureComponent } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import LText from "../../components/LText";
import Button from "../../components/Button";
import IconCheck from "../../icons/Check";
import CurrencyIcon from "../../components/CurrencyIcon";

import colors, { rgba } from "../../colors";

type Props = {
  t: *,
  navigation: NavigationScreenProp<{
    params: {
      currency: CryptoCurrency,
      deviceId: string,
    },
  }>,
};

type State = {};

class AddAccountsSuccess extends Component<Props, State> {
  static navigationOptions = {
    header: null,
  };

  primaryCTA = () => {
    this.props.navigation.navigate("AddAccountsSelectCrypto");
  };

  secondaryCTA = () => {
    this.props.navigation.navigate("Accounts");
  };

  render() {
    const { navigation, t } = this.props;
    const currency = navigation.getParam("currency");
    return (
      <SafeAreaView style={styles.root}>
        <CurrencySuccess currency={currency} />
        <LText secondary semiBold style={styles.title}>
          Accounts imported
        </LText>
        <LText style={styles.desc}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit praesent sit
          amet sagittis
        </LText>
        <View style={styles.buttonsContainer}>
          <Button
            containerStyle={styles.button}
            type="primary"
            title={t("addAccounts.success.cta")}
            onPress={this.primaryCTA}
          />
          <Button
            onPress={this.secondaryCTA}
            type="secondary"
            title={t("addAccounts.success.secondaryCTA")}
          />
        </View>
      </SafeAreaView>
    );
  }
}

class CurrencySuccess extends PureComponent<{ currency: CryptoCurrency }> {
  render() {
    const { currency } = this.props;
    return (
      <View
        style={[
          styles.currencySuccess,
          {
            backgroundColor: rgba(currency.color, 0.14),
          },
        ]}
      >
        <View style={styles.successBadge}>
          <IconCheck size={16} color={colors.white} />
        </View>
        <CurrencyIcon currency={currency} size={32} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  currencySuccess: {
    width: 80,
    height: 80,
    backgroundColor: "red",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  successBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 24 + 10,
    height: 24 + 10,
    borderRadius: (24 + 10) / 2,
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 32,
    fontSize: 16,
    color: colors.darkBlue,
  },
  desc: {
    marginTop: 16,
    marginBottom: 16,
    maxWidth: 350,
    textAlign: "center",
    fontSize: 14,
    color: colors.grey,
  },
  buttonsContainer: {
    width: "100%",
  },
  button: {
    marginBottom: 10,
  },
});

export default translate()(AddAccountsSuccess);
