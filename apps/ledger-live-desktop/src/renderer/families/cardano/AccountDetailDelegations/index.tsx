import React from "react";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { AccountDelegations } from "@features/flow-account-detail-delegations";
import { useCardanoDelegationsViewModel } from "./useCardanoDelegationsViewModel";

const CardanoDelegations = ({ account }: { account: CardanoAccount }) => (
  <AccountDelegations {...useCardanoDelegationsViewModel(account)} />
);

const AccountDetailDelegations = ({ account }: { account: CardanoAccount | TokenAccount }) =>
  account.type === "Account" && account.cardanoResources ? (
    <CardanoDelegations account={account} />
  ) : null;

export default AccountDetailDelegations;
