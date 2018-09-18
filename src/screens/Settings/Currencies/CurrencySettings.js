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
import CurrencyIcon from "../../../components/CurrencyIcon";

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
  const currency = getCryptoCurrencyById(
    props.navigation.state.params.currencyId,
  );
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
    headerTitle: navigation.state.params.headerTitle,
  });

  componentDidMount() {
    const { navigation, t, currency } = this.props;
    navigation.setParams({
      headerTitle: <CustomCurrencyHeader currency={currency} t={t} />,
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
        {currency !== intermediaryCurrency && (
          <SettingsRow
            arrowRight={currencySettings.exchange}
            title={t("settings.currencies.rateProvider", {
              currencyTicker: currency.ticker,
            })}
            desc={t("settings.currencies.rateProviderDesc", {
              currencyTicker: currency.ticker,
            })}
            onPress={currencySettings.exchange ? this.goToExchange : null}
          >
            <LText style={styles.currencyExchange}>
              {currencySettings.exchange}
            </LText>
          </SettingsRow>
        )}
        {defaults.confirmationsNb && (
          <View style={styles.sliderContainer}>
            <SettingsRow
              title={t("settings.currencies.confirmationNb")}
              desc={t("settings.currencies.confirmationNbDesc")}
              onPress={null}
            >
              <LText
                tertiary
                style={[
                  styles.confirmationNbValue,
                  { color: colors.live, marginLeft: 8 },
                ]}
              >
                {value}
              </LText>
            </SettingsRow>
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
                <LText
                  tertiary
                  style={[styles.confirmationNbValue, { color: colors.grey }]}
                >
                  {defaults.confirmationsNb.min}
                </LText>
                <LText
                  tertiary
                  style={[styles.confirmationNbValue, { color: colors.grey }]}
                >
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
  confirmationNbValue: {
    fontSize: 16,
  },
});

export function CustomCurrencyHeader({
  currency,
  t,
}: {
  currency: Currency,
  t: T,
}) {
  return (
    <View
      style={{
        flexDirection: "row",
      }}
    >
      <View style={{ marginRight: 5, justifyContent: "center" }}>
        <CurrencyIcon size={16} currency={currency} />
      </View>
      <LText>
        {t("common:settings.currencies.currencySettingsTitle", {
          currencyName: currency.name,
        })}
      </LText>
    </View>
  );
}
