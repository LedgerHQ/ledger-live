import invariant from "invariant";
import React, { useEffect } from "react";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { CosmosRedelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  CosmosRedelegationFlowParamList,
  ScreenName.CosmosRedelegationValidator
>;

export default function RedelegationBridgeTransaction({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, undefined) as CosmosAccount;

  const bridge = getAccountBridge(account, undefined);

  const { transaction, bridgePending } = useBridgeTransaction(() => {
    const tx = route.params.transaction;

    if (!tx) {
      const t = bridge.createTransaction(mainAccount);
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "redelegate",
          validators: [],
        }),
      };
    }

    return { account, transaction: tx };
  });

  // as soon as the hook has run → continue
  useEffect(() => {
    if (!bridgePending && transaction) {
      navigation.replace(ScreenName.CosmosRedelegationSelectDevice, {
        account,
        mainAccount,
        transaction,
        validatorSrc: route.params.validatorSrc,
        validator: route.params.validator,
      });
    }
  }, [bridgePending, transaction, navigation, account, mainAccount, route.params]);

  // Render nothing (invisible screen)
  return null;
}
