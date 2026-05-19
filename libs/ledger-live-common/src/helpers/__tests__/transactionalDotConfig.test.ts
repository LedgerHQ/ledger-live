import { getTransactionalDotConfig } from "../transactionalDotConfig";

describe("getTransactionalDotConfig", () => {
  it("returns Close symbol with error appearance when hasFailed", () => {
    expect(getTransactionalDotConfig("OUT", false, true)).toEqual({
      symbol: "Close",
      appearance: "error",
    });
  });

  it("hasFailed takes priority over isPending", () => {
    expect(getTransactionalDotConfig("OUT", true, true)).toEqual({
      symbol: "Close",
      appearance: "error",
    });
  });

  it("returns Spinner symbol with muted appearance when pending", () => {
    expect(getTransactionalDotConfig("OUT", true)).toEqual({
      symbol: "Spinner",
      appearance: "muted",
    });
  });

  it.each([
    ["IN", "ArrowDown", "success"],
    ["NFT_IN", "ArrowDown", "success"],
    ["OUT", "ArrowUp", "muted"],
    ["NFT_OUT", "ArrowUp", "muted"],
    ["FEES", "Invoice", "muted"],
    ["REWARD", "StarFill", "success"],
    ["WITHDRAW", "StarFill", "success"],
    ["WITHDRAW_EXPIRE_UNFREEZE", "StarFill", "success"],
    ["REWARD_PAYOUT", "StarFill", "success"],
    ["WITHDRAW_UNBONDED", "StarFill", "success"],
    ["WITHDRAW_UNSTAKED", "StarFill", "success"],
    ["DELEGATE", "Link", "muted"],
    ["REDELEGATE", "Link", "muted"],
    ["BOND", "Link", "muted"],
    ["LOCK", "Link", "muted"],
    ["STAKE", "Link", "muted"],
    ["UNDELEGATE", "Unlink", "muted"],
    ["UNDELEGATE_RESOURCE", "Unlink", "muted"],
    ["UNBOND", "Unlink", "muted"],
    ["UNLOCK", "Unlink", "muted"],
    ["UNSTAKE", "Unlink", "muted"],
    ["APPROVE", "PenEdit", "muted"],
    ["FREEZE", "Snow", "muted"],
    ["UNFREEZE", "Snow", "muted"],
    ["LEGACY_UNFREEZE", "Snow", "muted"],
    ["VOTE", "Mailbox", "muted"],
  ] as const)(
    "maps %s to %s symbol with %s appearance",
    (operationType, expectedSymbol, expectedAppearance) => {
      expect(getTransactionalDotConfig(operationType, false)).toEqual({
        symbol: expectedSymbol,
        appearance: expectedAppearance,
      });
    },
  );

  it("returns null for unknown operation types", () => {
    expect(getTransactionalDotConfig("NONE", false)).toBeNull();
  });
});
