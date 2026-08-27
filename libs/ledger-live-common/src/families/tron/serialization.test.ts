import type { OperationExtra } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fromOperationExtraRaw, toOperationExtraRaw } from "./serialization";

// The amounts must come back as `BigNumber`s: the app renderers hand them straight to
// `formatCurrencyUnit` / `FormattedVal`, which produce garbage for a revived `{s,e,c}` literal.
describe("tron operation extra serialization", () => {
  const cases: { name: string; extra: OperationExtra }[] = [
    { name: "a freeze", extra: { frozenAmount: new BigNumber(1_000_000) } },
    { name: "an unfreeze", extra: { unfreezeAmount: new BigNumber(2_500_000) } },
    {
      name: "an undelegate, whose key the legacy type guard omitted",
      extra: {
        unDelegatedAmount: new BigNumber(3_000_000),
        receiverAddress: "TXJ9s2fCNcRjNigNWT2oba3tCKVVN59TaF",
      },
    },
    { name: "a vote", extra: { votes: [{ address: "TValidator", voteCount: 7 }] } },
    {
      name: "a plain send, carrying only framework keys",
      extra: { ledgerOpType: "OUT", assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" },
    },
  ];

  it.each(cases)("round-trips $name unchanged", ({ extra }) => {
    expect(fromOperationExtraRaw(toOperationExtraRaw(extra))).toEqual(extra);
  });

  it("persists the amounts as strings so the raw account stays JSON-safe", () => {
    expect(
      toOperationExtraRaw({
        frozenAmount: new BigNumber(1_000_000),
        unDelegatedAmount: new BigNumber(3_000_000),
        ledgerOpType: "FREEZE",
      }),
    ).toEqual({ frozenAmount: "1000000", unDelegatedAmount: "3000000", ledgerOpType: "FREEZE" });
  });

  it("revives every amount as a BigNumber, including the undelegate one", () => {
    const revived = fromOperationExtraRaw({
      frozenAmount: "1000000",
      unfreezeAmount: "2500000",
      unDelegatedAmount: "3000000",
    }) as Record<string, unknown>;

    expect(BigNumber.isBigNumber(revived.frozenAmount)).toBe(true);
    expect(BigNumber.isBigNumber(revived.unfreezeAmount)).toBe(true);
    expect(BigNumber.isBigNumber(revived.unDelegatedAmount)).toBe(true);
  });

  it("leaves the framework's own keys untouched, so wiring these hooks costs the rest nothing", () => {
    const extra = { ledgerOpType: "VOTE", assetReference: "1002000", memo: "hello" };

    expect(toOperationExtraRaw(extra)).toEqual(extra);
    expect(fromOperationExtraRaw(extra)).toEqual(extra);
  });
});
