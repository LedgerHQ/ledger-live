// @flow

import type { Account } from "@ledgerhq/live-common/types";

export const isAccountRegistrationPending = (accountId: string, accounts: Account[]): boolean => {
  // If there's a pending "REGISTER" operation and the
  // account's registration status is false, then
  // we know that the account is truly not registered yet.
  const account = accounts.find(currentAccount => accountId === currentAccount.id);
  const isAccountRegistrationPending =
    !!account &&
    account.pendingOperations.some(currentAccount => currentAccount.type === "REGISTER") &&
    !account.celoResources.registrationStatus;

  return isAccountRegistrationPending;
};
