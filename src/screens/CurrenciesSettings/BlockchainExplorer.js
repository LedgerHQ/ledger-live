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
    selectedKey: keyExtractor(currencySettings.blockchainExplorer),
    items: ["blockchain.info"] // FIXME will be different per currency. we will have the data in currency object
  };
};

const mapDispatchToProps = (dispatch: *, { navigation }: Props) => ({
  onValueChange: blockchainExplorer => {
    dispatch(
      updateCurrencySettings(navigation.state.params.coinType, {
        blockchainExplorer
      })
    );
  }
});

const Screen = makeGenericSelectScreen({
  title: "Edit BlockchainExplorer",
  keyExtractor,
  formatItem: str => str
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
