import { CLI } from "tests/utils/cliUtils";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";

type LiveDataCommandOptions = {
  readonly useScheme?: boolean;
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

    const { address } = await CLI.getAddress({
      currency: account.currency.speculosApp.name,
      path: account.accountPath,
      derivationMode: account.derivationMode,
    });

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

    const { address } = await CLI.getAddress({
      currency: accountToAssign.parentAccount.currency.id,
      path: accountToAssign.parentAccount.accountPath,
    });

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

    const { address } = await CLI.getAddress({
      currency: tx.accountToCredit.currency.speculosApp.name,
      path: tx.accountToCredit.accountPath,
      derivationMode: tx.accountToCredit.derivationMode,
    });

    tx.accountToCredit.address = address;
    tx.recipientAddress = address;

    return address;
  };
};
