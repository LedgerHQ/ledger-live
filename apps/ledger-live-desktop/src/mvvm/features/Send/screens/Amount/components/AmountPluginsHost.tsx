import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { AmountExtraFields } from "./AmountExtraFields";

type AmountPluginProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

export function AmountPluginsHost(props: AmountPluginProps) {
  const mainAccount = useMemo(
    () => getMainAccount(props.account, props.parentAccount ?? undefined),
    [props.account, props.parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  useFlowEffects({
    account: props.account,
    parentAccount: props.parentAccount,
    transaction: props.transaction,
    currency,
    updateTransaction: props.transactionActions.updateTransaction,
  });

  // Generic, family agnostic declarative visual fields driven by the descriptor.
  const extraFields = useMemo(() => sendFeatures.getAmountExtraFields(currency), [currency]);

  return (
    <AmountExtraFields
      account={props.account}
      parentAccount={props.parentAccount}
      transaction={props.transaction}
      transactionActions={props.transactionActions}
      fields={extraFields}
    />
  );
}
