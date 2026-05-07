import {
  ArrowDown,
  ArrowUp,
  Close,
  Invoice,
  Link,
  Mailbox,
  PenEdit,
  Snow,
  StarFill,
  Unlink,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { getTransactionalDotConfig } from "../getTransactionalDotConfig";

describe("getTransactionalDotConfig", () => {
  it("returns spinner with muted appearance when pending", () => {
    const config = getTransactionalDotConfig("OUT", true);
    expect(config).toEqual({ icon: Spinner, appearance: "muted" });
  });

  it.each([
    ["IN", ArrowDown, "success"],
    ["NFT_IN", ArrowDown, "success"],
    ["OUT", ArrowUp, "muted"],
    ["NFT_OUT", ArrowUp, "muted"],
    ["FEES", Invoice, "muted"],
    ["REWARD", StarFill, "success"],
    ["WITHDRAW", StarFill, "success"],
    ["WITHDRAW_EXPIRE_UNFREEZE", StarFill, "success"],
    ["REWARD_PAYOUT", StarFill, "success"],
    ["WITHDRAW_UNBONDED", StarFill, "success"],
    ["WITHDRAW_UNSTAKED", StarFill, "success"],
    ["DELEGATE", Link, "muted"],
    ["REDELEGATE", Link, "muted"],
    ["BOND", Link, "muted"],
    ["LOCK", Link, "muted"],
    ["STAKE", Link, "muted"],
    ["UNDELEGATE", Unlink, "muted"],
    ["UNDELEGATE_RESOURCE", Unlink, "muted"],
    ["UNBOND", Unlink, "muted"],
    ["UNLOCK", Unlink, "muted"],
    ["UNSTAKE", Unlink, "muted"],
    ["APPROVE", PenEdit, "muted"],
    ["FREEZE", Snow, "muted"],
    ["UNFREEZE", Snow, "muted"],
    ["LEGACY_UNFREEZE", Snow, "muted"],
    ["VOTE", Mailbox, "muted"],
  ] as const)(
    "maps %s to the expected icon and appearance",
    (operationType, expectedIcon, expectedAppearance) => {
      const config = getTransactionalDotConfig(operationType, false);
      expect(config).toEqual({ icon: expectedIcon, appearance: expectedAppearance });
    },
  );

  it("returns null for operation types without a transactional dot", () => {
    expect(getTransactionalDotConfig("NONE", false)).toBeNull();
  });

  it("returns close icon with error appearance when hasFailed", () => {
    expect(getTransactionalDotConfig("OUT", false, true)).toEqual({
      icon: Close,
      appearance: "error",
    });
  });

  it("hasFailed takes priority over isOptimistic", () => {
    expect(getTransactionalDotConfig("OUT", true, true)).toEqual({
      icon: Close,
      appearance: "error",
    });
  });
});
