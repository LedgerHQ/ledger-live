/* @flow */
import React, { Fragment, PureComponent } from "react";
import { connect } from "react-redux";
import { View, StyleSheet } from "react-native";
import type { Currency } from "@ledgerhq/currencies";
import SettingsRow from "../../components/SettingsRow";
import SectionTitle from "../../components/SectionTitle";
import CurrencyIcon from "../../components/CurrencyIcon";
import LText from "../../components/LText";
import { currencySettingsSelector } from "../../reducers/settings";
import type { CurrencySettings } from "../../reducers/settings";
import type { State } from "../../reducers";

const mapStateToProps = (state: State, props: { currency: Currency }) => ({
  currencySettings: currencySettingsSelector(state, props.currency)
});

class CurrencySettingsSection extends PureComponent<{
  currency: Currency,
  currencySettings: CurrencySettings,
  navigation: *
}> {
  goTo = (routeName: string) => () => {
    const { navigation, currency } = this.props;
    navigation.navigate({
      routeName,
      key: routeName,
      params: { coinType: currency.coinType }
    });
  };

  goToConfirmationsToSpend = this.goTo("ConfirmationsToSpend");
  goToConfirmations = this.goTo("Confirmations");
  goToTransactionFees = this.goTo("TransactionFees");
  goToBlockchainExplorer = this.goTo("BlockchainExplorer");

  render() {
    const { currency, currencySettings } = this.props;
    return (
      <Fragment>
        <SectionTitle>
          <View style={styles.currencySection}>
            <CurrencyIcon size={20} currency={currency} />
            <LText semiBold style={styles.currencyName}>
              {currency.name}
            </LText>
          </View>
        </SectionTitle>

        <SettingsRow
          arrowRight
          title="Confirmation to spend"
          onPress={this.goToConfirmationsToSpend}
        >
          <LText>{currencySettings.confirmationsToSpend}</LText>
        </SettingsRow>

        <SettingsRow
          arrowRight
          title="Number of confirmations"
          onPress={this.goToConfirmations}
        >
          <LText>{currencySettings.confirmations}</LText>
        </SettingsRow>

        <SettingsRow
          arrowRight
          title="Default Transactions fees"
          onPress={this.goToTransactionFees}
        >
          <LText>{currencySettings.transactionFees}</LText>
        </SettingsRow>

        <SettingsRow
          arrowRight
          title="Blockchain explorer"
          onPress={this.goToBlockchainExplorer}
        >
          <LText>{currencySettings.blockchainExplorer}</LText>
        </SettingsRow>
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(CurrencySettingsSection);

const styles = StyleSheet.create({
  currencySection: {
    flexDirection: "row"
  },
  currencyName: {
    fontSize: 14,
    marginLeft: 6
  }
});
