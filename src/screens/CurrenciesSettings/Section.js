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

        <SettingsRow arrowRight title="Confirmation to spend">
          <LText>{currencySettings.confirmationsToSpend}</LText>
        </SettingsRow>

        <SettingsRow arrowRight title="Number of confirmations">
          <LText>{currencySettings.confirmations}</LText>
        </SettingsRow>

        <SettingsRow arrowRight title="Default Transactions fees">
          <LText>{currencySettings.transactionFees}</LText>
        </SettingsRow>

        <SettingsRow arrowRight title="Blockchain explorer">
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
