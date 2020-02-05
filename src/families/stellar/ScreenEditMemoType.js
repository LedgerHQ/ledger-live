/* @flow */
import { connect } from "react-redux";
import { StellarMemoType } from "@ledgerhq/live-common/lib/families/stellar/types";
import i18next from "i18next";
import type { State } from "../../reducers";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import makeGenericSelectScreen from "../../screens/makeGenericSelectScreen";

const items = StellarMemoType.map(type => ({
  label: type,
  value: type,
}));

const mapStateToProps = (state: State, props: *) => ({
  selectedKey: props.navigation.state.params.transaction.memoType
    ? props.navigation.state.params.transaction.memoType
    : "NO_MEMO",
  items,
});

const mapDispatchToProps = {
  onValueChange: ({ value }, props: *) => {
    const { navigation } = props;
    const account = navigation.getParam("account");
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    navigation.navigate("StellarEditMemoValue", {
      accountId: account.id,
      transaction,
      memoType: value,
    });
  },
};

const Screen = makeGenericSelectScreen({
  id: "StellarEditMemoType",
  itemEventProperties: item => ({ memoType: item.value }),
  title: i18next.t("send.summary.validateMemo.type"),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Screen);
