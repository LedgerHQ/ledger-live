/* @flow */
import React, { Fragment, PureComponent } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, StyleSheet, Slider } from "react-native";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../../components/SettingsRow";
import SectionTitle from "../../../components/SectionTitle";
import CurrencyIcon from "../../../components/CurrencyIcon";
import LText from "../../../components/LText";
import {
  currencySettingsSelector,
  intermediaryCurrency,
} from "../../../reducers/settings";
import type { CurrencySettings } from "../../../reducers/settings";
import type { State } from "../../../reducers";
import type { T } from "../../../types/common";
import { updateCurrencySettings } from "../../../actions/settings";
import colors from "../../../colors";
import { currencySettingsDefaults } from "../../../helpers/CurrencySettingsDefaults";

type Props = {
  currency: Currency,
  currencySettings: CurrencySettings,
  navigation: *,
  updateCurrencySettings: Function,
  t: T,
  defaults: *,
};
type LocalState = {
  value: number,
};

const mapStateToProps = (state: State, props: { currency: Currency }) => ({
  currencySettings: currencySettingsSelector(state, props.currency),
  defaults: currencySettingsDefaults(props.currency),
});

const mapDispatchToProps = {
  updateCurrencySettings,
};
class CurrencySettingsSection extends PureComponent<Props, LocalState> {
  constructor(props) {
    super(props);
    this.state = {
      value: props.currencySettings.confirmationsNb,
    };
  }

  goToExchange = () => {
    const { navigation, currency, currencySettings } = this.props;
    navigation.navigate("RateProviderSettings", {
      from: currency.ticker,
      to: intermediaryCurrency.ticker,
      selected: currencySettings.exchange,
    });
  };

  updateSettings = () => {
    const { value } = this.state;
    const { updateCurrencySettings, currency } = this.props;
    updateCurrencySettings(currency.id, { confirmationsNb: value });
  };
  render() {
    const { currency, defaults, t, currencySettings } = this.props;
    const { value } = this.state;

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
          arrowRight={currencySettings.exchange}
          title={t("common:settings.currencies.rateProvider", {
            currencyTicker: currency.ticker,
          })}
          desc={t("common:settings.currencies.rateProviderDesc")}
          onPress={currencySettings.exchange ? this.goToExchange : null}
        >
          <LText style={styles.currencyExchange}>
            {currencySettings.exchange}
          </LText>
        </SettingsRow>
        {defaults.confirmationsNb && (
          <View style={styles.sliderContainer}>
            <SettingsRow
              title={t("common:settings.currencies.confirmationNb")}
              desc={t("common:settings.currencies.confirmationNbDesc")}
              onPress={null}
            />
            <View style={styles.container}>
              <Slider
                step={1}
                minimumValue={defaults.confirmationsNb.min}
                maximumValue={defaults.confirmationsNb.max}
                value={value}
                onValueChange={val => this.setState({ value: val })}
                onSlidingComplete={this.updateSettings}
              />
              <View style={styles.textContainer}>
                <LText style={styles.rangeText}>
                  {defaults.confirmationsNb.min}
                </LText>
                <LText>{this.state.value}</LText>
                <LText style={styles.rangeText}>
                  {defaults.confirmationsNb.max}
                </LText>
              </View>
            </View>
          </View>
        )}
      </Fragment>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(CurrencySettingsSection);

const styles = StyleSheet.create({
  currencySection: {
    flexDirection: "row",
  },
  currencyName: {
    fontSize: 14,
    marginLeft: 6,
  },
  currencyExchange: {
    fontSize: 14,
    color: colors.grey,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    margin: 16,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeText: {
    color: colors.grey,
  },
  sliderContainer: {
    backgroundColor: "white",
  },
});
