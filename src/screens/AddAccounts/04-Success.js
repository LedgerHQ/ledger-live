// @flow

import React, { Component, PureComponent } from "react";
import { translate, Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import Icon from "react-native-vector-icons/dist/Feather";
import colors, { rgba } from "../../colors";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import Button from "../../components/Button";
import IconCheck from "../../icons/Check";
import CurrencyIcon from "../../components/CurrencyIcon";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      currency: CryptoCurrency,
      deviceId: string,
    },
  }>,
};

type State = {};

const IconPlus = () => <Icon name="plus" color={colors.live} size={16} />;

class AddAccountsSuccess extends Component<Props, State> {
  static navigationOptions = {
    header: null,
  };

  primaryCTA = () => {
    this.props.navigation.navigate("Accounts");
  };

  secondaryCTA = () => {
    this.props.navigation.navigate("AddAccountsSelectCrypto");
  };

  render() {
    const { navigation } = this.props;
    const currency = navigation.getParam("currency");
    return (
      <View style={styles.root}>
        <TrackScreen category="AddAccounts" name="Success" />
        <CurrencySuccess currency={currency} />
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="addAccounts.imported" />
        </LText>
        <LText style={styles.desc}>
          <Trans i18nKey="addAccounts.success.desc" />
        </LText>
        <View style={styles.buttonsContainer}>
          <Button
            event="AddAccountsDone"
            containerStyle={styles.button}
            type="primary"
            title={<Trans i18nKey="addAccounts.success.cta" />}
            onPress={this.primaryCTA}
          />
          <Button
            event="AddAccountsAgain"
            IconLeft={IconPlus}
            onPress={this.secondaryCTA}
            type="lightSecondary"
            title={<Trans i18nKey="addAccounts.success.secondaryCTA" />}
          />
        </View>
      </View>
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
    paddingHorizontal: 20,
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
    fontSize: 18,
    color: colors.darkBlue,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
    color: colors.grey,
  },
  buttonsContainer: {
    alignSelf: "stretch",
  },
  button: {
    marginBottom: 16,
  },
});

export default translate()(AddAccountsSuccess);
