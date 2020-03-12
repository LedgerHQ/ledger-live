/* @flow */
import { connect } from "react-redux";
import { StellarMemoType } from "@ledgerhq/live-common/lib/families/stellar/types";
import i18next from "i18next";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import type { State } from "../../reducers";
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
  cancelNavigateBack: true,
  onValueChange: ({ value }) => {
    const { navigation } = props;
    const transaction = navigation.getParam("transaction");
    const account = navigation.getParam("account");
    if (value === "NO_MEMO") {
      const bridge = getAccountBridge(account);
      navigation.navigate("SendSummary", {
        accountId: account.id,
        transaction: bridge.updateTransaction(transaction, {
          memoType: value,
          memoValue: null,
        }),
      });
    } else {
      navigation.navigate("StellarEditMemoValue", {
        accountId: account.id,
        transaction,
        memoType: value,
      });
    }
  },
});

const Screen = makeGenericSelectScreen({
  id: "StellarEditMemoType",
  itemEventProperties: item => ({ memoType: item.value }),
  title: i18next.t("send.summary.memo.type"),
  keyExtractor: item => item.value,
  formatItem: item => item.label,
});

export default connect(mapStateToProps)(Screen);
