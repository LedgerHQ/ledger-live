import BigNumber from "bignumber.js";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { TransactionRaw } from "../types";

const ccdRaw: TransactionRaw = {
  family: "concordium",
  amount: "10000000",
  recipient: "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w",
  fee: "501",
  memo: undefined,
  useAllAmount: false,
};

describe("transaction serialization", () => {
  it("round-trips a CCD transaction without adding PLT fields", () => {
    const raw = toTransactionRaw(fromTransactionRaw(ccdRaw));

    expect(raw).toMatchObject({ family: "concordium", fee: "501" });
    // Absent must stay absent, not become `undefined` keys: a CCD transaction
    // has to serialize to the shape it had before PLT existed.
    expect("tokenId" in raw).toBe(false);
    expect("energy" in raw).toBe(false);
  });

  it("round-trips tokenId and energy when both are set", () => {
    const raw = toTransactionRaw(fromTransactionRaw({ ...ccdRaw, tokenId: "PLT", energy: 759 }));

    expect(raw.tokenId).toBe("PLT");
    expect(raw.energy).toBe(759);
  });

  it("carries tokenId and energy onto the runtime transaction", () => {
    const tx = fromTransactionRaw({ ...ccdRaw, tokenId: "PLT", energy: 759 });

    expect(tx.tokenId).toBe("PLT");
    expect(tx.energy).toBe(759);
    expect(tx.fee).toEqual(new BigNumber("501"));
  });

  it("keeps energy a JSON-safe number through a stringify cycle", () => {
    const raw = toTransactionRaw(fromTransactionRaw({ ...ccdRaw, tokenId: "PLT", energy: 759 }));

    // A bigint here would throw; the number survives storage untouched.
    expect(JSON.parse(JSON.stringify(raw)).energy).toBe(759);
  });

  it("round-trips each PLT field independently of the other", () => {
    expect(toTransactionRaw(fromTransactionRaw({ ...ccdRaw, tokenId: "PLT" }))).toMatchObject({
      tokenId: "PLT",
    });
    expect("energy" in toTransactionRaw(fromTransactionRaw({ ...ccdRaw, tokenId: "PLT" }))).toBe(
      false,
    );

    expect(toTransactionRaw(fromTransactionRaw({ ...ccdRaw, energy: 501 }))).toMatchObject({
      energy: 501,
    });
    expect("tokenId" in toTransactionRaw(fromTransactionRaw({ ...ccdRaw, energy: 501 }))).toBe(
      false,
    );
  });

  it("preserves a zero energy rather than dropping it as falsy", () => {
    const raw = toTransactionRaw(fromTransactionRaw({ ...ccdRaw, energy: 0 }));

    expect(raw.energy).toBe(0);
  });
});
