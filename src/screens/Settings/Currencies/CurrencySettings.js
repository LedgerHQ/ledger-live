/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Slider from "react-native-slider";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { confirmationsNbForCurrencySelector } from "../../../reducers/settings";
import type { State } from "../../../reducers";
import type { T } from "../../../types/common";
import { updateCurrencySettings } from "../../../actions/settings";
import colors from "../../../colors";
import { TrackScreen } from "../../../analytics";
import { currencySettingsDefaults } from "../../../helpers/CurrencySettingsDefaults";
import CurrencyIcon from "../../../components/CurrencyIcon";

type Props = {
  confirmationsNb: number,
  navigation: NavigationScreenProp<*>,
  updateCurrencySettings: Function,
  t: T,
  defaults: *,
  currency: CryptoCurrency,
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
    confirmationsNb: confirmationsNbForCurrencySelector(state, { currency }),
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
    headerRight: null,
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
      value: props.confirmationsNb,
    };
  }

  updateSettings = () => {
    const { value } = this.state;
    const { updateCurrencySettings, currency } = this.props;
    updateCurrencySettings(currency.ticker, { confirmationsNb: value });
  };

  render() {
    const { defaults, t, currency } = this.props;
    const { value } = this.state;
    return (
      <View style={styles.root}>
        <TrackScreen
          category="Settings"
          name="Currency"
          currency={currency.id}
        />
        {defaults.confirmationsNb && (
          <View style={styles.sliderContainer}>
            <SettingsRow
              event="CurrencyConfirmationsNb"
              title={t("settings.currencies.confirmationNb")}
              desc={t("settings.currencies.confirmationNbDesc")}
              onPress={null}
              alignedTop
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
                thumbTintColor={colors.live}
                minimumTrackTintColor={colors.live}
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
      </View>
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
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  currencyExchange: {
    fontSize: 14,
    color: colors.grey,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
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
  currency: CryptoCurrency,
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
      <LText semiBold secondary style={{ fontSize: 16 }}>
        {t("settings.currencies.currencySettingsTitle", {
          currencyName: currency.name,
        })}
      </LText>
    </View>
  );
}
