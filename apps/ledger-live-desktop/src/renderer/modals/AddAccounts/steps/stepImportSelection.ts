import { Account } from "@ledgerhq/types-live";

type EmptyChecker = { isAccountEmpty: (account: Account) => boolean };

export const classifyChecked = (
  checked: Account[],
  bridges: EmptyChecker[],
): { willCreateAccount: boolean; willAddAccounts: boolean } => {
  let willCreateAccount = false;
  let willAddAccounts = false;
  for (let i = 0; i < checked.length; i++) {
    if (bridges[i].isAccountEmpty(checked[i])) willCreateAccount = true;
    else willAddAccounts = true;
    if (willCreateAccount && willAddAccounts) break;
  }
  return { willCreateAccount, willAddAccounts };
};
