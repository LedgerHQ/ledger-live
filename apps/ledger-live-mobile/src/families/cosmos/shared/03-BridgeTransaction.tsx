import React, { useEffect } from "react";
import invariant from "invariant";
import { Flex } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CosmosRedelegationFlowParamList } from "../RedelegationFlow/types";
import { CosmosUndelegationFlowParamList } from "../UndelegationFlow/types";
import { Loading } from "~/components/Loading";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props =
  | StackNavigatorProps<
      CosmosRedelegationFlowParamList,
      ScreenName.CosmosRedelegationBridgeTransaction
    >
  | StackNavigatorProps<
      CosmosUndelegationFlowParamList,
      ScreenName.CosmosUndelegationBridgeTransaction
    >;

export default function CosmosBridgeTransaction({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account, "account required");

  const mainAccount = getMainAccount(account) as CosmosAccount;
  const bridge = getAccountBridge(account);
  const { transaction: initialTx, mode } = route.params;

  const { transaction, bridgePending, status } = useBridgeTransaction(() => {
    if (!initialTx) {
      const t = bridge.createTransaction(mainAccount);

      if (mode === "undelegation") {
        const validator = route.params?.validator;
        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "undelegation",
            validators: [
              {
                address: validator?.validatorAddress ?? "",
                amount: BigNumber(0),
              },
            ],
            recipient: mainAccount.freshAddress,
          }),
        };
      }
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "redelegate",
          validators: [],
        }),
      };
    }

    return { account, transaction: initialTx };
  });
  useEffect(() => {
    if (bridgePending || !transaction) return;

    if (mode === "undelegation") {
      // @ts-expect-error navigate cannot infer the correct navigator + route
      navigation.replace(ScreenName.CosmosUndelegationSelectDevice, {
        ...route.params,
        accountId: account.id,
        transaction,
        status,
      });
    } else {
      // @ts-expect-error navigate cannot infer the correct navigator + route
      navigation.replace(ScreenName.CosmosRedelegationSelectDevice, {
        ...route.params,
        validatorName: route.params.validatorName,
        accountId: account.id,
        transaction,
        status,
      });
    }
  }, [mode, account, transaction, status, bridgePending, navigation, route.params]);
  return (
    <Flex flex={1} justifyContent="center" alignItems="center" px={6}>
      <Loading size={40} />
    </Flex>
  );
}
