import React, { PureComponent } from "react";
import { connect } from "react-redux";
import Config from "react-native-config";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import Scanner from "../../components/Scanner";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
  account: AccountLike;
  parentAccount: Account | null | undefined;
};
type RouteParams = {
  accountId: string;
  transaction: Transaction;
};
// eslint-disable-next-line @typescript-eslint/ban-types
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { amount, address, currency, ...rest } = decodeURIScheme(result);
    const transaction = route.params?.transaction;
    const patch: Record<string, any> = {};
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
        screenName={ScreenName.SendCoin}
        onResult={this.onResult}
      />
    );
  }
}

const mapStateToProps = (state, { route }) =>
  accountScreenSelector(route)(state);

// eslint-disable-next-line @typescript-eslint/ban-types
const m: React.ComponentType<{}> = connect(mapStateToProps)(ScanRecipient);
export default m;
