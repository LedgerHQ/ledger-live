import { buildIntentData } from "@ledgerhq/live-common/families/tron/bridge/api";
import type { Transaction as TronTransaction } from "@ledgerhq/live-common/families/tron/types";
import { mergeTronFamilySpecificData } from "../familySpecificData";

/**
 * The staking screens are the only writers of tron's `familySpecificData`, and what they write is
 * what the coin module receives: `familySpecificData` → `buildIntentData` → `TronTxData`.
 */
const createdTransaction = (mode: TronTransaction["mode"]) =>
  ({
    family: "tron",
    mode,
    // What the generic framework's `createTransaction` seeds for tron.
    familySpecificData: { resource: null, duration: 3, votes: [] },
  }) as unknown as TronTransaction;

describe("mergeTronFamilySpecificData", () => {
  it("should keep the framework-seeded keys when a screen sets only the resource", () => {
    expect(
      mergeTronFamilySpecificData(createdTransaction("freeze"), { resource: "ENERGY" }),
    ).toEqual({ resource: "ENERGY", duration: 3, votes: [] });
  });

  it("should return the patch alone when the transaction carries no bag yet", () => {
    expect(mergeTronFamilySpecificData({}, { resource: "BANDWIDTH" })).toEqual({
      resource: "BANDWIDTH",
    });
  });

  it("should return the patch alone when there is no transaction yet", () => {
    expect(mergeTronFamilySpecificData(undefined, { resource: "BANDWIDTH" })).toEqual({
      resource: "BANDWIDTH",
    });
  });

  it("should not mutate the transaction's bag", () => {
    const transaction = createdTransaction("freeze");

    mergeTronFamilySpecificData(transaction, { resource: "ENERGY" });

    expect(transaction.familySpecificData).toEqual({ resource: null, duration: 3, votes: [] });
  });
});

describe("staking round trip to the coin module", () => {
  it.each(["freeze", "unfreeze", "unDelegateResource"] as const)(
    "should carry the resource a %s screen picked through to the intent data",
    mode => {
      const familySpecificData = mergeTronFamilySpecificData(createdTransaction(mode), {
        resource: "ENERGY",
      });

      expect(buildIntentData({ mode, familySpecificData })).toEqual({
        type: "tron",
        mode,
        resource: "ENERGY",
        duration: 3,
        votes: [],
      });
    },
  );

  it("should carry votes through to the intent data for a vote", () => {
    const votes = [{ name: null, address: "TCsFmsyMkzUYqQCPfHnB4vzhwEK6XxvAdY", voteCount: 1 }];
    const familySpecificData = mergeTronFamilySpecificData(createdTransaction("vote"), { votes });

    expect(buildIntentData({ mode: "vote", familySpecificData })).toEqual({
      type: "tron",
      mode: "vote",
      resource: null,
      duration: 3,
      votes,
    });
  });

  it.each(["claimReward", "withdrawExpireUnfreeze", "legacyUnfreeze"] as const)(
    "should reach the coin module as %s with only the seeded bag",
    mode => {
      const familySpecificData = mergeTronFamilySpecificData(createdTransaction(mode), {});

      expect(buildIntentData({ mode, familySpecificData })).toEqual({
        type: "tron",
        mode,
        resource: null,
        duration: 3,
        votes: [],
      });
    },
  );
});
