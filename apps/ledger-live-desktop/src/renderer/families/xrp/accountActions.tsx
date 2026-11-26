import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  ReceiveActionDefault,
  SendActionDefault,
} from "~/renderer/screens/account/AccountActionsDefault";
import { isFrozenToken } from "./utils";

type Props = Readonly<{
  account: Account | TokenAccount;
  parentAccount: Account | null | undefined;
  onClick: () => void;
}>;

function SendAction({ account, parentAccount, onClick }: Props) {
  return <SendActionDefault onClick={onClick} disabled={isFrozenToken(account, parentAccount)} />;
}

function ReceiveAction({ account, parentAccount, onClick }: Props) {
  return (
    <ReceiveActionDefault onClick={onClick} disabled={isFrozenToken(account, parentAccount)} />
  );
}

export default {
  SendAction,
  ReceiveAction,
};
