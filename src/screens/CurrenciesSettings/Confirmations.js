/* @flow */
import { connect } from "react-redux";
import range from "lodash/range";
import type { NavigationScreenProp } from "react-navigation";
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import { updateCurrencySettings } from "../../actions/settings";
import { currencySettingsSelector } from "../../reducers/settings";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      coinType: number
    }
  }>
};

const keyExtractor = (n: number) => String(n);

const mapStateToProps = (state: State, { navigation }: Props) => {
  const { coinType } = navigation.state.params;
  const currency = getCurrencyByCoinType(coinType);
  const currencySettings = currencySettingsSelector(state, currency);
  return {
    selectedKey: keyExtractor(currencySettings.confirmations),
    items: range(1, 50) // FIXME will be different per currency. we will have the data in currency object
  };
};

const mapDispatchToProps = (dispatch: *, { navigation }: Props) => ({
  onValueChange: confirmations => {
    dispatch(
      updateCurrencySettings(navigation.state.params.coinType, {
        confirmations
      })
    );
  }
});

const Screen = makeGenericSelectScreen({
  title: "Edit Confirmations",
  keyExtractor,
  formatItem: (n: number) => String(n)
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
