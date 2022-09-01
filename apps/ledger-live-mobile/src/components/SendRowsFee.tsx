import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import perFamily from "../generated/SendRowsFee";

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
  route,
  setTransaction,
  ...props
}: {
  transaction: Transaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  navigation: any;
  status?: TransactionStatus;
  route: {
    params: {
      accountId: string;
      parentAccountId?: string;
      transaction: Transaction;
      currentNavigation?: string;
      nextNavigation?: string;
      overrideAmountLabel?: string;
      hideTotal?: boolean;
      appName?: string;
    };
  };
  setTransaction: (..._: Array<Transaction>) => any;
  [key: string]: unknown;
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  // eslint-disable-next-line no-prototype-builtins
  if (perFamily.hasOwnProperty(mainAccount.currency.family)) {
    const C = perFamily[mainAccount.currency.family as keyof typeof perFamily];
    // FIXME: looks like a hack, need to find how to handle networkInfo properly
    return (transaction as BitcoinTransaction)?.networkInfo ? (
      <C
        {...props}
        setTransaction={setTransaction}
        // FIXME: PLEAS TAKE A LOOK AT THIS EXPECT ERROR AND DO WHATEVER YOU GOT TO DO
        // @ts-expect-error transaction types apparently cannot overlap, lel
        transaction={transaction}
        account={account}
        parentAccount={parentAccount as Account}
        navigation={navigation}
        route={route}
      />
    ) : null;
  }

  return null;
};
