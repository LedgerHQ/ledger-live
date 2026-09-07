import { getRawTransactionType, getStakeTarget, type TransactionLike } from "./transactionShape";

const tx = (fields: Record<string, unknown>): TransactionLike => fields;

describe("getRawTransactionType", () => {
  it("returns undefined without a transaction", () => {
    expect(getRawTransactionType(undefined)).toBeUndefined();
    expect(getRawTransactionType(null)).toBeUndefined();
  });

  it("reads mode for families that expose one", () => {
    expect(getRawTransactionType(tx({ family: "cosmos", mode: "delegate" }))).toBe("delegate");
    expect(getRawTransactionType(tx({ family: "celo", mode: "lock" }))).toBe("lock");
  });

  it("reads solana's dotted model.kind", () => {
    expect(getRawTransactionType(tx({ family: "solana", model: { kind: "stake.delegate" } }))).toBe(
      "stake.delegate",
    );
  });

  // EVM native staking sets a mode; a plain send and a dApp call do not. That is what scopes
  // this to in-app staking without inspecting call data.
  it("reads mode for EVM native staking and nothing for other EVM transactions", () => {
    expect(getRawTransactionType(tx({ family: "ethereum", mode: "delegate" }))).toBe("delegate");
    expect(getRawTransactionType(tx({ family: "ethereum", data: "0x095ea7b3" }))).toBeUndefined();
  });

  it("returns undefined for families with no action discriminator", () => {
    expect(getRawTransactionType(tx({ family: "bitcoin" }))).toBeUndefined();
  });
});

describe("getStakeTarget", () => {
  it("reads Cardano poolId as a single-element list", () => {
    expect(getStakeTarget(tx({ family: "cardano", mode: "delegate", poolId: "pool123" }))).toEqual([
      "pool123",
    ]);
  });

  it("reads cosmos validators[].address", () => {
    expect(
      getStakeTarget(
        tx({ family: "cosmos", validators: [{ address: "cosmosvaloper1" }, { address: "v2" }] }),
      ),
    ).toEqual(["cosmosvaloper1", "v2"]);
  });

  // Tron's votes moved into familySpecificData when it joined the generic coin framework.
  it("reads tron votes from familySpecificData", () => {
    expect(
      getStakeTarget(
        tx({
          family: "tron",
          mode: "vote",
          familySpecificData: { votes: [{ address: "TVote2" }] },
        }),
      ),
    ).toEqual(["TVote2"]);
  });

  it("reads polkadot validators[] and tron votes[].address", () => {
    expect(getStakeTarget(tx({ family: "polkadot", validators: ["addr1"] }))).toEqual(["addr1"]);
    expect(getStakeTarget(tx({ family: "tron", votes: [{ address: "TVote" }] }))).toEqual([
      "TVote",
    ]);
  });

  it("reads the solana vote account and the hedera staking node id", () => {
    expect(
      getStakeTarget(tx({ family: "solana", model: { uiState: { voteAccAddr: "voteAcc" } } })),
    ).toEqual(["voteAcc"]);
    expect(getStakeTarget(tx({ family: "hedera", stakingNodeId: 7 }))).toEqual(["7"]);
  });

  it("reads valAddress for EVM native staking", () => {
    expect(
      getStakeTarget(tx({ family: "ethereum", mode: "delegate", valAddress: "0xval" })),
    ).toEqual(["0xval"]);
  });

  // These families put the validator in `recipient`, so reading it would report a plain
  // send's payee as a delegation target.
  it("returns undefined for recipient-overloading families and non-staking transactions", () => {
    expect(
      getStakeTarget(tx({ family: "tezos", mode: "delegate", recipient: "tz1" })),
    ).toBeUndefined();
    expect(
      getStakeTarget(tx({ family: "sui", mode: "delegate", recipient: "0xval" })),
    ).toBeUndefined();
    expect(getStakeTarget(tx({ family: "cosmos", mode: "send" }))).toBeUndefined();
    expect(getStakeTarget(undefined)).toBeUndefined();
  });
});
