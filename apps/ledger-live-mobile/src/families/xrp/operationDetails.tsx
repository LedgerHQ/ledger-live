import { Operation, AccountLike } from "@ledgerhq/types-live";

type Props = {
  operation: Operation;
  type: string;
  account: AccountLike;
};

function OperationDetailsExtra({ operation, type, account }: Props) {
  // Return nothing - no extra fields should be displayed for XRP
  return null;
}

export default {
  OperationDetailsExtra,
};