import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { FrozenTokensBanner } from "./components/FrozenTokensBanner";
import { getFrozenTokens } from "./utils";

type Props = Readonly<{
  account: Account | TokenAccount;
  parentAccount: Account | null | undefined;
}>;

export default function AccountSubHeader({ account, parentAccount }: Props) {
  const frozenTokens =
    account.type === "TokenAccount"
      ? getFrozenTokens([account], parentAccount)
      : getFrozenTokens(account.subAccounts ?? [], account);

  return <FrozenTokensBanner className="mb-24" tokens={frozenTokens} />;
}
