import type { Operation } from "@ledgerhq/types-live";

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getURLWhatIsThis: (op: Operation, currencyId: string) =>
    op.type !== "IN" && op.type !== "OUT"
      ? "https://support.ledger.com/article/360010653260-zd?redirect=false"
      : null,
};
