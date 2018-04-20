/* @flow */
import { connect } from "react-redux";
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

const keyExtractor = str => str;

const mapStateToProps = (state: State, { navigation }: Props) => {
  const { coinType } = navigation.state.params;
  const currency = getCurrencyByCoinType(coinType);
  const currencySettings = currencySettingsSelector(state, currency);
  return {
    selectedKey: keyExtractor(currencySettings.transactionFees),
    items: ["low", "medium", "high"]
  };
};

const mapDispatchToProps = (dispatch: *, { navigation }: Props) => ({
  onValueChange: transactionFees => {
    dispatch(
      updateCurrencySettings(navigation.state.params.coinType, {
        transactionFees
      })
    );
  }
});

const Screen = makeGenericSelectScreen({
  title: "Edit Transaction fees",
  keyExtractor,
  formatItem: str => str
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
