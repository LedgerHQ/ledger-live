import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ICPAccount, ICPAccountRaw } from "../types";
import { NeuronsData } from "../types/neuron";

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const icpAccount = account as ICPAccount;
  const icpAccountRaw = accountRaw as ICPAccountRaw;
  if (icpAccount.neurons) {
    icpAccountRaw.neuronsData = icpAccount.neurons.serialize();
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const icpAccount = account as ICPAccount;
  const icpAccountRaw = accountRaw as ICPAccountRaw;
  icpAccount.neurons = icpAccountRaw.neuronsData
    ? NeuronsData.deserialize(icpAccountRaw.neuronsData)
    : NeuronsData.empty();
}
