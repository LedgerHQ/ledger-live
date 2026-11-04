import React from "react";
import { useAccountData } from "@features/platform-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDataTarget } from "LLD/hooks/useAccountDataTargets";
import { useRefreshOnRevisionChange } from "LLD/hooks/useRefreshOnRevisionChange";
import { operationsRevision } from "../utils/operationsRevision";

function AccountOperationsQuery({
  account,
  descriptor,
}: Readonly<{ account: Account; descriptor: AccountDescriptor }>) {
  const { refresh } = useAccountData("operations", descriptor);
  useRefreshOnRevisionChange(refresh, operationsRevision(account));
  return null;
}

export function AccountOperationsQueries({
  targets,
}: Readonly<{ targets: readonly AccountDataTarget[] }>) {
  return targets.map(target => (
    <AccountOperationsQuery
      key={target.accountUUID}
      account={target.account}
      descriptor={target.descriptor}
    />
  ));
}
