import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";

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

function getDeviceTransactionConfig({
  status: { amount, estimatedFees },
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField | ExtraDeviceTransactionField> {
  const { assetCode, assetIssuer } = transaction;

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

  if (assetCode && assetIssuer) {
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
