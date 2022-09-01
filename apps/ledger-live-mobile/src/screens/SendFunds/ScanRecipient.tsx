import React, { memo, useCallback, useEffect } from "react";
import Config from "react-native-config";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useSelector } from "react-redux";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import Scanner from "../../components/Scanner";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

type NavigationProps =
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.ScanRecipient>
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSelectRecipient
    >;

const ScanRecipient = ({ route, navigation }: NavigationProps) => {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const onResult = useCallback(
    (result: string) => {
      if (!account) return;
      const bridge = getAccountBridge(account, parentAccount);
      const { amount, address, currency, ...rest } = decodeURIScheme(result);
      const transaction = route.params?.transaction;
      const patch: Record<string, unknown> = {};
      patch.recipient = address;

      if (amount) {
        patch.amount = amount;
      }

      for (const k in rest) {
        if (k in transaction) {
          patch[k] = rest[k];
        }
      }

      navigation.navigate(ScreenName.SendSelectRecipient, {
        params: {
          accountId: account.id,
          parentId: parentAccount && parentAccount.id,
          transaction: bridge.updateTransaction(transaction, patch),
          justScanned: true,
        },
      });
    },
    [account, navigation, parentAccount, route.params?.transaction],
  );

  useEffect(() => {
    if (Config.MOCK_SCAN_RECIPIENT) {
      onResult(Config.MOCK_SCAN_RECIPIENT);
    }
  }, [onResult]);

  // FIXME: screenName IS NOT DECLARED ON Scanner, NOT SURE OF THE IMPACT
  // return <Scanner screenName={ScreenName.SendCoin} onResult={onResult} />;
  return <Scanner onResult={onResult} />;
};

export default memo<NavigationProps>(ScanRecipient);
