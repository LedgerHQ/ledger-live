import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";

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
    }
  | {
      type: "stellar.assetIssuer";
      label: string;
    };

async function getDeviceTransactionConfig({
  status: { amount, estimatedFees },
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField | ExtraDeviceTransactionField>> {
  const { assetReference, assetOwner } = transaction;

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
    });
    fields.push({
      type: "stellar.assetIssuer",
      label: "Asset issuer",
    });
  }

  fields.push({
    type: "stellar.memo",
    label: "Memo",
  });

  //NB device displays [none] for an empty memo
  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
