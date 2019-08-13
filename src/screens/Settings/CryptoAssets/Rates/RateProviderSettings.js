// @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { View, StyleSheet } from "react-native";
import i18next from "i18next";
import { Trans } from "react-i18next";
import { findCurrencyByTicker } from "@ledgerhq/live-common/lib/currencies";

import type { Currency } from "@ledgerhq/live-common/lib/types";

import type { State } from "../../../../reducers";
import { setExchangePairsAction } from "../../../../actions/settings";
import makeGenericSelectScreen from "../../../makeGenericSelectScreen";
import CounterValues from "../../../../countervalues";
import LText from "../../../../components/LText";

const getExchanges = (from: Currency, to: Currency) =>
  CounterValues.fetchExchangesForPair(from, to);

const extractFromTo = props => {
  const { params } = props.navigation.state;
  const from = findCurrencyByTicker(params.from);
  const to = findCurrencyByTicker(params.to);
  return { from, to };
};

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
    marginBottom: 48,
  },
  empty: {
    textAlign: "center",
  },
});

const injectItems = C => {
  class Clz extends Component<*, *> {
    state = {
      items: [],
      loading: true,
    };

    async componentWillMount() {
      const { from, to } = extractFromTo(this.props);
      let exchanges;
      try {
        exchanges = from && to ? await getExchanges(from, to) : [];
      } catch {
        exchanges = [];
      }
      this.setState({ items: exchanges, loading: false });
    }

    render() {
      const { items, loading } = this.state;
      const { from, to } = extractFromTo(this.props);

      if (loading) return null;

      if (!Array.isArray(items) || items.length === 0) {
        return (
          <View style={styles.root}>
            <LText style={styles.empty}>
              <Trans i18nKey="settings.rates.noRateProvider" />
            </LText>
          </View>
        );
      }

      return <C {...this.props} from={from} to={to} items={items} />;
    }
  }
  // $FlowFixMe
  Clz.navigationOptions = C.navigationOptions;

  return Clz;
};

const mapStateToProps = (state: State, props: *) => ({
  selectedKey: props.navigation.state.params.selected,
});

const mapDispatchToProps = {
  onValueChange: ({ id }: *, { from, to }) =>
    setExchangePairsAction([{ from, to, exchange: id }]),
};

const Screen = makeGenericSelectScreen({
  id: "RateProviderSettingsSelect",
  itemEventProperties: item => ({ exchange: item.id }),
  title: i18next.t("settings.cryptoAssets.rateProviderHeader"),
  keyExtractor: item => item.id,
  formatItem: item => item.name,
  navigationOptions: {
    headerRight: null,
  },
});

export default injectItems(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(Screen),
);
