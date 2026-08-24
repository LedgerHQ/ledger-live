import {
  MODES_NEEDING_RESOURCES,
  MODES_SPENDING_AMOUNT,
  MODES_WITH_RECIPIENT,
  MODE_TRAITS,
  RESOURCE_STAKING_OPERATION_TYPES,
  SUPPORTED_MODES,
} from "./modes";

// Every expectation below is written out rather than derived from `MODE_TRAITS`: a test that reads
// the table it is checking would pass whatever the table said, including a flipped trait.
describe("Tron mode traits", () => {
  const sorted = (modes: Iterable<string>) => [...modes].sort();

  it("supports exactly the modes the union declares", () => {
    expect(sorted(SUPPORTED_MODES)).toEqual([
      "claimReward",
      "freeze",
      "legacyUnfreeze",
      "send",
      "unDelegateResource",
      "unfreeze",
      "vote",
      "withdrawExpireUnfreeze",
    ]);
  });

  it("carries a recipient only for the modes addressed at another account", () => {
    expect(sorted(MODES_WITH_RECIPIENT)).toEqual(["legacyUnfreeze", "send", "unDelegateResource"]);
  });

  it("spends the intent amount only for send and freeze", () => {
    // `unDelegateResource` is absent on purpose: reclaiming a delegation moves TRX between the
    // account's own buckets, so nothing leaves the spendable balance.
    expect(sorted(MODES_SPENDING_AMOUNT)).toEqual(["freeze", "send"]);
  });

  it("needs the staked-resource state for the modes that act on an existing stake", () => {
    expect(sorted(MODES_NEEDING_RESOURCES)).toEqual([
      "claimReward",
      "legacyUnfreeze",
      "unfreeze",
      "vote",
      "withdrawExpireUnfreeze",
    ]);
  });

  it("maps each resource-staking mode to its operation type", () => {
    // Compared as an object, so the assertion does not depend on Map iteration order.
    expect(Object.fromEntries(RESOURCE_STAKING_OPERATION_TYPES)).toEqual({
      freeze: "FREEZE",
      unfreeze: "UNFREEZE",
      vote: "VOTE",
      withdrawExpireUnfreeze: "WITHDRAW_EXPIRE_UNFREEZE",
      unDelegateResource: "UNDELEGATE_RESOURCE",
      legacyUnfreeze: "LEGACY_UNFREEZE",
    });
  });

  it("leaves send and claimReward to the framework's own mode mapping", () => {
    expect(MODE_TRAITS.send.operationType).toBeUndefined();
    expect(MODE_TRAITS.claimReward.operationType).toBeUndefined();
  });

  it("answers no for a prototype member, so an untrusted mode cannot inherit a yes", () => {
    expect(SUPPORTED_MODES.has("constructor")).toBe(false);
    expect(RESOURCE_STAKING_OPERATION_TYPES.has("toString")).toBe(false);
  });
});
