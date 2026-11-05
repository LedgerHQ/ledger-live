import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { AccountDelegations } from "@features/flow-account-detail-delegations";
import DRepDelegationSelfTransactionInfoDrawer from "./Delegations/DRepDelegationSelfTransactionInfoDrawer";
import { useCardanoDelegationsViewModel } from "./useCardanoDelegationsViewModel";

const CardanoDelegations = ({ account }: Readonly<{ account: CardanoAccount }>) => {
  const { props, selfTxDrawer } = useCardanoDelegationsViewModel(account);
  return (
    <>
      <AccountDelegations {...props} />
      <DRepDelegationSelfTransactionInfoDrawer account={account} {...selfTxDrawer} />
    </>
  );
};

const AccountDetailDelegations = ({ account }: Readonly<{ account: AccountLike }>) =>
  account.type === "Account" && (account as CardanoAccount).cardanoResources ? (
    <CardanoDelegations account={account as CardanoAccount} />
  ) : null;

export default AccountDetailDelegations;
