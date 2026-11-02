import React from "react";
import { Trans } from "react-i18next";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import Alert from "~/renderer/components/Alert";

type Props = Readonly<{ account: MultiversXAccount | TokenAccount }>;

function isGuardedAccount(account: MultiversXAccount | TokenAccount): boolean {
  return account.type === "Account" && account.multiversxResources?.isGuarded === true;
}

export default function MultiversXAccountSubHeader({ account }: Props) {
  if (!isGuardedAccount(account)) return null;
  return (
    <Alert type="warning" mb={3}>
      <Trans i18nKey="elrond.guardedAccountWarning" />
    </Alert>
  );
}
