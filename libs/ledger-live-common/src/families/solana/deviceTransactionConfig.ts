import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getMainAccount } from "../../account";
import {
  getTransactionStakeAccount,
  getTransactionTransferFee,
  getTransactionValidator,
  isTokenTransferTransaction,
  isTransferTransaction,
  getStakeCreationDeposit,
} from "./transactions";

export type ExtraDeviceTransactionField = {
  type: "solana.token.transferFee";
  label: string;
};

type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

const addressIf = (label: string, address: string | undefined): DeviceTransactionField[] =>
  address ? [{ type: "address", label, address }] : [];

function transferFields(transaction: Transaction): DeviceTransactionField[] {
  if (!isTokenTransferTransaction(transaction)) return [{ type: "amount", label: "Transfer" }];

  const transferFee = getTransactionTransferFee(transaction);
  return [
    { type: "amount", label: "Transfer tokens" },
    ...(transferFee && transferFee.feeBps > 0
      ? ([{ type: "solana.token.transferFee", label: "Transfer fee" }] as const)
      : []),
    { type: "text", value: "Solana", label: "Network" },
    { type: "fees", label: "Max network fees" },
  ];
}

function tokenAccountFields(
  transaction: Transaction,
  owner: string,
): DeviceTransactionField[] | undefined {
  const tokenAccount = transaction.ownerTokenAccount;
  switch (transaction.mode) {
    case "opt-in":
      return [
        ...addressIf("Create token acct", tokenAccount),
        ...addressIf("From mint", transaction.assetReference),
        { type: "address", label: "Owned by", address: owner },
        { type: "address", label: "Funded by", address: owner },
        { type: "address", label: "Fee payer", address: owner },
      ];
    case "approve":
      return [
        ...addressIf("Approve token account", tokenAccount),
        { type: "address", label: "Owned by", address: owner },
        { type: "address", label: "Delegate to", address: transaction.recipient },
        { type: "amount", label: "Amount" },
      ];
    case "revoke":
      return [
        ...addressIf("Revoke token account", tokenAccount),
        { type: "address", label: "Owned by", address: owner },
      ];
    default:
      return undefined;
  }
}

function stakeFields(
  mainAccount: Account,
  transaction: Transaction,
  owner: string,
): DeviceTransactionField[] {
  const stakeAccount = getTransactionStakeAccount(transaction);
  const stakeAccountAddress =
    typeof transaction.feeParameters?.stakeAccountAddress === "string"
      ? transaction.feeParameters.stakeAccountAddress
      : undefined;

  switch (transaction.mode) {
    case "stake":
      return [
        ...addressIf("Delegate from", stakeAccountAddress),
        {
          type: "text",
          label: "Deposit",
          value: formatCurrencyUnit(
            mainAccount.currency.units[0],
            getStakeCreationDeposit(transaction),
            { disableRounding: true, showCode: true },
          ),
        },
        { type: "address", label: "New authority", address: owner },
        ...validatorFields(transaction, stakeAccount),
      ];
    case "undelegate":
      return [
        ...addressIf("Deactivate stake", stakeAccount),
        ...addressIf("Vote account", getTransactionValidator(transaction)),
      ];
    case "unstake":
      return [
        { type: "amount", label: "Stake withdraw" },
        ...validatorFields(transaction, stakeAccount),
      ];
    case "split": {
      const { stakeAccountSeed } = transaction.familySpecificData ?? {};
      return [
        { type: "amount", label: "Split stake" },
        ...addressIf("From", stakeAccount),
        ...addressIf("To", stakeAccountAddress),
        { type: "address", label: "Base", address: owner },
        ...(stakeAccountSeed
          ? ([{ type: "text", label: "Seed", value: stakeAccountSeed }] as const)
          : []),
        { type: "address", label: "Authorized by", address: owner },
        { type: "address", label: "Fee payer", address: owner },
      ];
    }
    default:
      return validatorFields(transaction, stakeAccount);
  }
}

function validatorFields(
  transaction: Transaction,
  stakeAccount: string | undefined,
): DeviceTransactionField[] {
  return [
    ...addressIf(transaction.mode === "unstake" ? "From" : "Delegate from", stakeAccount),
    ...addressIf("Vote account", getTransactionValidator(transaction)),
  ];
}

function getFields({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
}): DeviceTransactionField[] {
  if (transaction.raw) return [];
  if (isTransferTransaction(transaction)) return transferFields(transaction);

  const mainAccount = getMainAccount(account, parentAccount);
  const owner = mainAccount.freshAddress;
  return tokenAccountFields(transaction, owner) ?? stakeFields(mainAccount, transaction, owner);
}

function getDeviceTransactionConfig(
  arg: Parameters<typeof getFields>[0],
): Promise<Array<DeviceTransactionField>> {
  return Promise.resolve(getFields(arg));
}

export default getDeviceTransactionConfig;
