/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { ScreenName } from "../../../../const";
import { pairsSelector } from "../../../../countervalues";
import SettingsRow from "../../../../components/SettingsRow";
import LText from "../../../../components/LText";
import colors from "../../../../colors";
import Price from "./Price";

type Pair = {|
  from: Currency,
  to: Currency,
  exchange: ?string,
|};

type Props = {|
  navigation: *,
  pairs: Pair[],
|};

const mapStateToProps = createStructuredSelector({
  pairs: pairsSelector,
});

const currencyColors = {
  fiat: "#6490f1",
  crypto: "#41ccb4",
};

class CurrenciesList extends PureComponent<Props> {
  renderItem = ({ index, item: p }: { index: number, item: Pair }) => (
    <SettingsRow
      title={
        <Trans i18nKey="settings.rates.pair">
          {{ from: p.from.ticker }}
          {{ to: p.to.ticker }}
        </Trans>
      }
      titleContainerStyle={[
        styles.rowTitle,
        {
          borderLeftColor:
            p.to.type === "FiatCurrency"
              ? currencyColors.fiat
              : currencyColors.crypto,
        },
      ]}
      desc={<Price from={p.from} to={p.to} style={styles.rowDesc} />}
      noTextDesc
      borderTop={index !== 0}
      arrowRight
      compact
      event="RateSettingsRow"
      onPress={() => {
        this.props.navigation.navigate(ScreenName.RateProviderSettings, {
          from: p.from.ticker,
          to: p.to.ticker,
          selected: p.exchange,
        });
      }}
    >
      {/* FIXME display actual name instead of ID */}
      <LText>{p.exchange || ""}</LText>
    </SettingsRow>
  );

  // prettier-ignore
  keyExtractor = ({ from, to }: Pair): string => `${from.name || ""}-${to.name || ""}`;

  render() {
    const { pairs } = this.props;

    return (
      <FlatList
        ListHeaderComponent={() => (
          <>
            <LText style={styles.desc}>
              <Trans i18nKey="settings.rates.desc" />
            </LText>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.dot, { backgroundColor: currencyColors.fiat }]}
                />
                <LText semiBold>
                  <Trans i18nKey="settings.rates.cryptoToFiat" />
                </LText>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: currencyColors.crypto },
                  ]}
                />
                <LText semiBold>
                  <Trans i18nKey="settings.rates.cryptoToCrypto" />
                </LText>
              </View>
            </View>
          </>
        )}
        data={pairs}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        contentContainerStyle={styles.root}
      />
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
    backgroundColor: colors.white,
  },
  desc: {
    padding: 16,
  },
  rowTitle: {
    borderLeftWidth: 3,
    paddingLeft: 12 + 3, // 12px + borderWidth
  },
  legend: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    fontSize: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 4,
  },
  rowDesc: {
    marginTop: 8,
  },
});

export default connect(mapStateToProps)(CurrenciesList);
