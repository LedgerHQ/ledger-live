import React from "react";
import { useAccountData } from "@features/platform-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountDataTarget } from "LLD/hooks/useAccountDataTargets";

function AccountBalanceQuery({ descriptor }: Readonly<{ descriptor: AccountDescriptor }>) {
  useAccountData("balance", descriptor);
  return null;
}

export function AccountBalanceQueries({
  targets,
}: Readonly<{ targets: readonly AccountDataTarget[] }>) {
  return targets.map(target => (
    <AccountBalanceQuery key={target.accountUUID} descriptor={target.descriptor} />
  ));
}
