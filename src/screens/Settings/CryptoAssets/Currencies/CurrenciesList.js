/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { ScreenName } from "../../../../const";
import { cryptoCurrenciesSelector } from "../../../../reducers/accounts";
import SettingsRow from "../../../../components/SettingsRow";
import CurrencyIcon from "../../../../components/CurrencyIcon";

type Props = {
  navigation: *,
  currencies: CryptoCurrency[],
};

const mapStateToProps = createStructuredSelector({
  currencies: cryptoCurrenciesSelector,
});

class CurrenciesList extends PureComponent<Props> {
  renderItem = ({ item }) => (
    <SettingsRow
      event="CurrenciesList"
      eventProperties={{ currency: item.id }}
      title={`${item.name} (${item.ticker})`}
      iconLeft={<CurrencyIcon size={20} currency={item} />}
      key={item.id}
      desc={null}
      arrowRight
      onPress={() =>
        this.props.navigation.navigate(ScreenName.CurrencySettings, {
          currencyId: item.id,
        })
      }
    />
  );

  keyExtractor = item => item.id;

  render() {
    const { currencies } = this.props;
    return (
      <FlatList
        data={currencies}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        contentContainerStyle={styles.containerStyle}
      />
    );
  }
}

const styles = StyleSheet.create({
  containerStyle: { paddingTop: 16, paddingBottom: 64 },
});

export default connect(mapStateToProps)(CurrenciesList);
