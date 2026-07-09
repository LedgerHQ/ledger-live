import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { Transaction, TransactionStatus } from "./types";

export type ExtraDeviceTransactionField =
  | {
      type: "stellar.memo";
      label: string;
    }
  | {
      type: "stellar.network";
      label: string;
    }
  | {
      type: "stellar.assetCode";
      label: string;
      value: string;
    }
  | {
      type: "stellar.assetIssuer";
      label: string;
      value: string;
    };

async function getDeviceTransactionConfig({
  account,
  parentAccount,
  status: { amount, estimatedFees },
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField | ExtraDeviceTransactionField>> {
  // The token asset is derived from `subAccountId` (single source of truth) for a token send,
  // or from the transaction itself for changeTrust (no sub-account yet). For stellar,
  // token.name = asset code and token.contractAddress = asset issuer (see bridge/api.ts).
  const mainAccount = getMainAccount(account, parentAccount);
  const subAccount = transaction.subAccountId
    ? mainAccount.subAccounts?.find(a => a.id === transaction.subAccountId)
    : undefined;
  const { assetReference, assetOwner } =
    subAccount?.type === "TokenAccount"
      ? { assetReference: subAccount.token.name, assetOwner: subAccount.token.contractAddress }
      : { assetReference: transaction.assetReference, assetOwner: transaction.assetOwner };

  const fields: Array<DeviceTransactionField | ExtraDeviceTransactionField> = [
    {
      type: "stellar.network",
      label: "Network",
    },
  ];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (assetReference && assetOwner) {
    fields.push({
      type: "stellar.assetCode",
      label: "Asset",
      value: assetReference,
    });
    fields.push({
      type: "stellar.assetIssuer",
      label: "Asset issuer",
      value: assetOwner,
    });
  }

  fields.push({
    type: "stellar.memo",
    label: "Memo",
  });

  // NB device displays [none] for an empty memo
  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
