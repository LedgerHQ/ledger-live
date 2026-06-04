import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { CeloFeeCurrencyPlugin } from "./plugins/CeloFeeCurrencyPlugin";

type AmountPluginProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

type AmountPluginComponent = (props: AmountPluginProps) => React.ReactElement | null;

const pluginRegistry: Readonly<Record<string, AmountPluginComponent>> = {
  celoFeeCurrency: CeloFeeCurrencyPlugin,
};

export function AmountPluginsHost(props: AmountPluginProps) {
  const mainAccount = useMemo(
    () => getMainAccount(props.account, props.parentAccount ?? undefined),
    [props.account, props.parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const pluginIds = useMemo(() => sendFeatures.getAmountPlugins(currency), [currency]);

  return (
    <>
      {pluginIds.map(id => {
        const Plugin = pluginRegistry[id];
        if (!Plugin) return null;
        return <Plugin key={id} {...props} />;
      })}
    </>
  );
}
