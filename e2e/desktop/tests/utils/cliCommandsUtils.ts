import invariant from "invariant";
import { CLI } from "tests/utils/cliUtils";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";

type LiveDataCommandOptions = {
  readonly useScheme?: boolean;
};

export const getAccountAddress = async (account: Account | TokenAccount): Promise<string> => {
  if (account.currency.id === Currency.HBAR.id) {
    invariant(account.address, "hedera: account address must be pre-set");
    return account.address;
  }

  const { address } = await CLI.getAddress({
    currency: account.currency.speculosApp.name,
    path: account.accountPath,
    derivationMode: account.derivationMode,
  });

  return address;
};

export const liveDataCommand =
  (account: Account | TokenAccount, options?: LiveDataCommandOptions) =>
  async (appjsonPath: string) => {
    await CLI.liveData({
      currency: account.currency.speculosApp.name,
      index: account.index,
      ...(options?.useScheme && account.derivationMode ? { scheme: account.derivationMode } : {}),
      add: true,
      appjson: appjsonPath,
    });
  };

export const liveDataWithAddressCommand =
  (account: Account | TokenAccount, options?: LiveDataCommandOptions) =>
  async (appjsonPath: string) => {
    await liveDataCommand(account, options)(appjsonPath);

    const address = await getAccountAddress(account);

    account.address = address;
    if ("parentAccount" in account && account.parentAccount) {
      account.parentAccount.address = address;
    }

    return address;
  };

export const liveDataWithParentAddressCommand =
  (liveDataAccount: Account | TokenAccount, accountToAssign: TokenAccount) =>
  async (appjsonPath: string) => {
    await CLI.liveData({
      currency: liveDataAccount.currency.speculosApp.name,
      index: liveDataAccount.index,
      add: true,
      appjson: appjsonPath,
    });

    if (!accountToAssign.parentAccount) {
      throw new Error("Parent account is required");
    }

    const address = await getAccountAddress(accountToAssign.parentAccount);

    accountToAssign.address = address;
    return address;
  };

export const liveDataWithRecipientAddressCommand = (
  tx: Transaction,
  options?: LiveDataCommandOptions,
) => {
  return async (appjsonPath: string) => {
    await CLI.liveData({
      currency: tx.accountToDebit.currency.speculosApp.name,
      index: tx.accountToDebit.index,
      ...(options?.useScheme && tx.accountToDebit.derivationMode
        ? { scheme: tx.accountToDebit.derivationMode }
        : {}),
      add: true,
      appjson: appjsonPath,
    });

    const address = await getAccountAddress(tx.accountToCredit);

    tx.accountToCredit.address = address;
    tx.recipientAddress = address;

    return address;
  };
};

export const liveDataWithMemoTagRecipientAddressCommand = (
  fromAccount: Account,
  toAccount: Account,
  options?: LiveDataCommandOptions,
) => {
  return async (appjsonPath: string) => {
    // Load both accounts via CLI (like ledgerSync / swap tests).
    // Use currency.id (e.g. "ripple", "cardano") - required for XRP; Cardano works with either.
    await CLI.liveData({
      currency: fromAccount.currency.id,
      index: fromAccount.index,
      ...(options?.useScheme && fromAccount.derivationMode
        ? { scheme: fromAccount.derivationMode }
        : {}),
      add: true,
      appjson: appjsonPath,
    });

    await CLI.liveData({
      currency: toAccount.currency.id,
      index: toAccount.index,
      ...(options?.useScheme && toAccount.derivationMode
        ? { scheme: toAccount.derivationMode }
        : {}),
      add: true,
      appjson: appjsonPath,
    });

    const address = await getAccountAddress(toAccount);
    toAccount.address = address;
    return address;
  };
};
