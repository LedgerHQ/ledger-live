import type { Operation } from "../../types";

function formatOperationSpecifics(op: Operation): string {
  const { memo } = op.extra;

  return memo ? `\n    Memo: ${memo}` : "";
}

export default {
  formatOperationSpecifics,
};
