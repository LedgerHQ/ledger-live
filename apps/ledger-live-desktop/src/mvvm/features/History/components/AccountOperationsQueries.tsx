import React, { useEffect, useRef } from "react";
import { useAccountData } from "@features/platform-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDataTarget } from "../hooks/useAccountDataTargets";
import { operationsRevision } from "../utils/operationsRevision";

function AccountOperationsQuery({
  account,
  descriptor,
}: Readonly<{ account: Account; descriptor: AccountDescriptor }>) {
  const { refresh } = useAccountData("operations", descriptor);
  const revision = operationsRevision(account);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = revision;
      return;
    }
    if (seen.current === revision) return;
    seen.current = revision;
    void refresh();
  }, [refresh, revision]);

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
