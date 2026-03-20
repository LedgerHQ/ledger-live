import { concatUserAndLedgerPoolIds } from "./ValidatorField";

describe("Testing ValidatorField functions", () => {
  it.each([[[]], [["1"]], [["1", "2"]]])(
    "should return only Ledger pool ids when user has not used any pool previously",
    (ledgerPoolIds: string[]) => {
      const ids = concatUserAndLedgerPoolIds(undefined, ledgerPoolIds);
      expect(ids.length).toEqual(ledgerPoolIds.length);
      ledgerPoolIds.forEach(id => expect(ids).toContain(id));
    },
  );

  it.each([[[]], [["1"]], [["1", "2"]]])(
    "should return user last used pool and Ledger pool ids",
    (ledgerPoolIds: string[]) => {
      const ids = concatUserAndLedgerPoolIds("3", ledgerPoolIds);
      expect(ids.length).toEqual(ledgerPoolIds.length + 1);
      expect(ids).toContain("3");
      ledgerPoolIds.forEach(id => expect(ids).toContain(id));
    },
  );
});
