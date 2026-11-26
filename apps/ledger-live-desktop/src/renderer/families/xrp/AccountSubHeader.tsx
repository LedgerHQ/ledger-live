import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { FrozenTokensBanner } from "./components/FrozenTokensBanner";
import { isFrozenToken } from "./utils";

type Props = Readonly<{
  account: Account | TokenAccount;
  parentAccount: Account | null | undefined;
}>;

function getFrozenTokens(
  account: Account | TokenAccount,
  parentAccount: Account | null | undefined,
) {
  if (account.type === "TokenAccount") {
    return isFrozenToken(account, parentAccount) ? [account.token] : [];
  }

  return (account.subAccounts ?? [])
    .filter(tokenAccount => isFrozenToken(tokenAccount, account))
    .map(tokenAccount => tokenAccount.token);
}

export default function AccountSubHeader({ account, parentAccount }: Props) {
  return <FrozenTokensBanner className="mb-24" tokens={getFrozenTokens(account, parentAccount)} />;
}
