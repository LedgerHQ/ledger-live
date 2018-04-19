/* @flow */
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Unit } from "@ledgerhq/currencies";
import { updateAccount } from "../../actions/accounts";
import { accountByIdSelector } from "../../reducers/accounts";
import type { State } from "../../reducers";
import makeGenericSelectScreen from "../makeGenericSelectScreen";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      accountId: string
    }
  }>
};

const keyExtractor = (unit: Unit) => String(unit.magnitude);

const mapStateToProps = (state: State, { navigation }: Props) => {
  const { accountId } = navigation.state.params;
  const account = accountByIdSelector(state, accountId);
  if (!account) throw new Error(`no account ${accountId}`);
  return {
    selectedKey: keyExtractor(account.unit),
    items: account.currency.units
  };
};

const mapDispatchToProps = (dispatch: *, { navigation }: Props) => ({
  onValueChange: (unit: Unit) => {
    dispatch(
      updateAccount({
        unit,
        id: navigation.state.params.accountId
      })
    );
  }
});

const Screen = makeGenericSelectScreen({
  title: "Edit Units",
  keyExtractor,
  formatItem: (unit: Unit) => `${unit.name} (${unit.code})`
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
