/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import Config from "react-native-config";
import { decodeURIScheme } from "@ledgerhq/live-common/lib/currencies";
import type {
  Account,
  AccountLike,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import Scanner from "../../components/Scanner";

type Props = {
  navigation: any,
  route: { params: RouteParams },
  account: AccountLike,
  parentAccount: ?Account,
  colors: *,
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

type State = {};

class ScanRecipient extends PureComponent<Props, State> {
  componentDidMount() {
    if (Config.MOCK_SCAN_RECIPIENT) {
      this.onResult(Config.MOCK_SCAN_RECIPIENT);
    }
  }

  onResult = (result: string) => {
    const { account, parentAccount, route } = this.props;
    if (!account) return;
    const bridge = getAccountBridge(account, parentAccount);
    const { amount, address, currency, ...rest } = decodeURIScheme(result);
    const transaction = route.params?.transaction;
    const patch: Object = {};
    patch.recipient = address;
    if (amount) {
      patch.amount = amount;
    }
    for (const k in rest) {
      if (k in transaction) {
        patch[k] = rest[k];
      }
    }

    this.props.navigation.navigate(ScreenName.SendSelectRecipient, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.updateTransaction(transaction, patch),
      justScanned: true,
    });
  };

  render() {
    const { navigation } = this.props;

    return (
      <Scanner
        navigation={navigation}
        screenName={ScreenName.SendFunds}
        onResult={this.onResult}
      />
    );
  }
}

const mapStateToProps = (state, { route }) =>
  accountScreenSelector(route)(state);

export default connect(mapStateToProps)(ScanRecipient);
