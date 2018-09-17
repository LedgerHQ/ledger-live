/* @flow */
import React, { PureComponent } from "react";
import { FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { currenciesSelector } from "../../../reducers/accounts";
import SettingsRow from "../../../components/SettingsRow";
import CurrencyIcon from "../../../components/CurrencyIcon";

type Props = {
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
};

const mapStateToProps = createStructuredSelector({
  currencies: currenciesSelector,
});

class CurrenciesList extends PureComponent<Props> {
  static navigationOptions = () => ({
    title: "Currencies",
  });

  renderItem = ({ item }) => (
    <SettingsRow
      title={`${item.name} (${item.ticker})`}
      iconLeft={<CurrencyIcon size={20} currency={item} />}
      key={item.id}
      desc={null}
      arrowRight
      onPress={() =>
        this.props.navigation.navigate("CurrencySettings", {
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
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
      />
    );
  }
}

export default connect(mapStateToProps)(CurrenciesList);
