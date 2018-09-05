/* @flow */
import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, Slider, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/helpers/currencies";
import SettingsRow from "../../../components/SettingsRow";
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
  currencySettings: CurrencySettings,
  navigation: NavigationScreenProp<*>,
  updateCurrencySettings: Function,
  t: T,
  defaults: *,
  currency: Currency,
};
type LocalState = {
  value: number,
};

const mapStateToProps = (
  state: State,
  props: { navigation: NavigationScreenProp<*>, currencyId: string },
) => {
  // TODO we shouldn't do the branching here. introduce more nested component to resolve this and not having to do if.
  const currency = props.currencyId
    ? getCryptoCurrencyById(props.currencyId)
    : getCryptoCurrencyById(props.navigation.state.params.currencyId);
  return {
    currencySettings: currencySettingsSelector(state, { currency }),
    defaults: currencySettingsDefaults(currency),
    currency,
  };
};

const mapDispatchToProps = {
  updateCurrencySettings,
};

class EachCurrencySettings extends Component<Props, LocalState> {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.title}`,
  });
  componentDidMount() {
    const { navigation, t, currency } = this.props;
    navigation.setParams({
      title: t("common:settings.currencies.currencySettingsTitle", {
        currencyName: currency.name,
      }),
    });
  }
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
    const { defaults, t, currencySettings, currency } = this.props;
    const { value } = this.state;
    return (
      <Fragment>
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
)(EachCurrencySettings);

const styles = StyleSheet.create({
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
    minHeight: 200,
  },
});
