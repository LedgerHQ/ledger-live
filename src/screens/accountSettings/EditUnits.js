/* @flow */
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Unit } from "@ledgerhq/currencies";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import { updateAccount } from "../../actions/accounts";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      account: Account
    }
  }>
};

const mapStateToProps = (state: State, { navigation }: Props) => {
  const { account } = navigation.state.params; // FIXME should get by id
  return {
    items: account.currency.units,
    value: account.unit
  };
};

const mapDispatchToProps = (dispatch: *, { navigation }: Props) => ({
  onValueChange: (unit: Unit) => {
    dispatch(
      updateAccount({
        unit,
        id: navigation.state.params.account.id
      })
    );
  }
});

const Screen = makeGenericSelectScreen({
  title: "Edit Units",
  keyExtractor: unit => String(unit.magnitude),
  formatItem: unit => `${unit.name} (${unit.code})`
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
