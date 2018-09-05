/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { View } from "react-native";
import { translate } from "react-i18next";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import type { T } from "../../../types/common";
import { currenciesSelector } from "../../../reducers/accounts";
import SettingsRow from "../../../components/SettingsRow";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CurrencySettings from "./CurrencySettings";
import LText from "../../../components/LText";

type Props = {
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
  t: T,
};

const mapStateToProps = createStructuredSelector({
  currencies: currenciesSelector,
});

class CurrenciesSettings extends PureComponent<Props> {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.title}`,
  });

  render() {
    const { navigation, currencies, t } = this.props;
    if (!currencies.length) return null;
    return (
      <Fragment>
        {currencies.length < 2 ? (
          <RenderCurrencySettings
            currency={currencies[0]}
            navigation={navigation}
            t={t}
          />
        ) : (
          <RenderCurrencyList currencies={currencies} navigation={navigation} />
        )}
      </Fragment>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(CurrenciesSettings);

class RenderCurrencyList extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
}> {
  render() {
    const { currencies, navigation } = this.props;
    return (
      <View>
        {currencies.map(currency => (
          <SettingsRow
            title={currency.ticker}
            iconLeft={<CurrencyIcon size={20} currency={currency} />}
            key={currency.id}
            desc={null}
            arrowRight
            onPress={() =>
              navigation.navigate("CurrencySettings", {
                currencyId: currency.id,
              })
            }
          />
        ))}
      </View>
    );
  }
}
class RenderCurrencySettings extends PureComponent<{
  currency: CryptoCurrency,
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  // TODO: add Coin Icon to the title
  componentDidMount() {
    const { navigation, t, currency } = this.props;
    navigation.setParams({
      title: (
        <LText>
          <CurrencyIcon size={20} currency={currency} />
          {t("common:settings.currencies.currencySettingsTitle", {
            currencyName: currency.name,
          })}
        </LText>
      ),
    });
  }
  render() {
    const { currency, navigation } = this.props;
    return (
      <CurrencySettings currencyId={currency.id} navigation={navigation} />
    );
  }
}
