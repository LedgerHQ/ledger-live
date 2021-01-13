/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans, withTranslation, useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Slider from "react-native-slider";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import SettingsRow from "../../../../components/SettingsRow";
import LText from "../../../../components/LText";
import { confirmationsNbForCurrencySelector } from "../../../../reducers/settings";
import type { State } from "../../../../reducers";
import type { T } from "../../../../types/common";
import { updateCurrencySettings } from "../../../../actions/settings";
import { withTheme } from "../../../../colors";
import { TrackScreen } from "../../../../analytics";
import { currencySettingsDefaults } from "../../../../helpers/CurrencySettingsDefaults";
import CurrencyIcon from "../../../../components/CurrencyIcon";

type Props = {
  confirmationsNb: number,
  navigation: *,
  updateCurrencySettings: Function,
  t: T,
  defaults: *,
  currency: CryptoCurrency,
  colors: *,
};
type LocalState = {
  value: number,
};
const mapStateToProps = (
  state: State,
  props: { navigation: *, currencyId: string },
) => {
  const currency = getCryptoCurrencyById(props.route.params.currencyId);
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
  componentDidMount() {
    const { navigation, currency } = this.props;
    navigation.setOptions({
      headerTitle: () => <CustomCurrencyHeader currency={currency} />,
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
    const { defaults, t, currency, colors } = this.props;
    const { value } = this.state;
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TrackScreen
          category="Settings"
          name="Currency"
          currency={currency.id}
        />
        {defaults.confirmationsNb ? (
          <View style={styles.sliderContainer}>
            <SettingsRow
              event="CurrencyConfirmationsNb"
              title={t("settings.currencies.confirmationNb")}
              desc={t("settings.currencies.confirmationNbDesc")}
              onPress={null}
              alignedTop
            >
              <LText
                semiBold
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
                  semiBold
                  style={[styles.confirmationNbValue, { color: colors.grey }]}
                >
                  {defaults.confirmationsNb.min}
                </LText>
                <LText
                  semiBold
                  style={[styles.confirmationNbValue, { color: colors.grey }]}
                >
                  {defaults.confirmationsNb.max}
                </LText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.placeholer}>
            <LText semiBold style={styles.placeholderText}>
              <Trans i18nKey="settings.currencies.placeholder" />
            </LText>
          </View>
        )}
      </View>
    );
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
  withTheme,
)(EachCurrencySettings);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 64,
    backgroundColor: "transparent",
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
  sliderContainer: {
    minHeight: 200,
  },
  placeholer: {
    padding: 16,
    paddingVertical: 24,
  },
  placeholderText: {
    fontSize: 16,
  },
  confirmationNbValue: {
    fontSize: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export function CustomCurrencyHeader({
  currency,
}: {
  currency: CryptoCurrency,
}) {
  const { t } = useTranslation();
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
