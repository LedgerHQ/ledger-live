import type { Operation } from "@ledgerhq/types-live";

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getURLWhatIsThis: (op: Operation, currencyId: string) =>
    op.type !== "IN" && op.type !== "OUT"
      ? "https://support.ledger.com/hc/en-us/articles/360010769019"
      : null,
};
