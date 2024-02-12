import React, { memo, useCallback, useEffect } from "react";
import Config from "react-native-config";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useSelector } from "react-redux";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import Scanner from "~/components/Scanner";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps =
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSelectRecipient>
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.ScanRecipient>;

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
        if (transaction && k in transaction) {
          patch[k] = rest[k as keyof typeof rest];
        }
      }

      // FIXME: how can this work?
      // This screen belongs to 2 navigators, Base & SendFunds,
      // but ScreenName.SendSelectRecipient does not exist in Base.
      // @ts-expect-error Crash when in coming from the base navigator?
      navigation.navigate(ScreenName.SendSelectRecipient, {
        ...route.params,
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction: bridge.updateTransaction(transaction, patch),
        justScanned: true,
      });
    },
    [account, navigation, parentAccount, route.params],
  );

  useEffect(() => {
    if (Config.MOCK_SCAN_RECIPIENT) {
      onResult(Config.MOCK_SCAN_RECIPIENT);
    }
  }, [onResult]);

  return <Scanner onResult={onResult} />;
};

export default memo<NavigationProps>(ScanRecipient);
