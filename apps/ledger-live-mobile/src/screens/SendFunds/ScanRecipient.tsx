import React, { memo, useCallback, useEffect } from "react";
import Config from "react-native-config";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { ScreenName, NavigatorName } from "~/const";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import Scanner from "~/components/Scanner";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.ScanRecipient>;

const ScanRecipient = ({ route, navigation }: NavigationProps) => {
  const { account, parentAccount } = useAccountScreen(route);
  const bridge = useAccountBridgeOrNull<Transaction>(account ?? null, parentAccount);

  const onResult = useCallback(
    (result: string) => {
      if (!account || !bridge) return;
      const { amount, address, currency, ...rest } = decodeURIScheme(result);
      const transaction = route.params?.transaction;
      if (!transaction) return;
      const patch: Record<string, unknown> = {};
      patch.recipient = address;

      if (amount) {
        patch.amount = amount;
      }

      Object.entries(rest).forEach(([key, value]) => {
        if (transaction && key in transaction && value !== undefined) {
          patch[key] = value;
        }
      });

      const updatedTransaction = bridge.updateTransaction(transaction, patch);

      navigation.popTo(NavigatorName.SendFunds, {
        screen: ScreenName.SendSelectRecipient,
        params: {
          ...route.params,
          accountId: account.id,
          parentId: parentAccount?.id,
          transaction: updatedTransaction,
          justScanned: true,
        },
      });
    },
    [account, bridge, navigation, parentAccount, route.params],
  );

  useEffect(() => {
    if (Config.MOCK_SCAN_RECIPIENT) {
      onResult(Config.MOCK_SCAN_RECIPIENT);
    }
  }, [onResult]);

  return <Scanner onResult={onResult} />;
};

export default memo<NavigationProps>(ScanRecipient);
