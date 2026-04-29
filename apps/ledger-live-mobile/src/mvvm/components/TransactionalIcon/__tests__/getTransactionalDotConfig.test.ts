import {
  ArrowDown,
  ArrowUp,
  Clock,
  Close,
  Invoice,
  Link,
  Mailbox,
  PenEdit,
  Snow,
  Star,
  Unlink,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { getTransactionalDotConfig } from "../getTransactionalDotConfig";

describe("getTransactionalDotConfig", () => {
  it("returns clock with muted appearance when optimistic", () => {
    const config = getTransactionalDotConfig("OUT", true);
    expect(config).toEqual({ icon: Clock, appearance: "muted" });
  });

  it.each([
    ["IN", ArrowDown, "success"],
    ["OUT", ArrowUp, "muted"],
    ["FEES", Invoice, "muted"],
    ["REWARD", Star, "success"],
    ["WITHDRAW", Star, "success"],
    ["DELEGATE", Link, "muted"],
    ["UNDELEGATE", Unlink, "muted"],
    ["APPROVE", PenEdit, "muted"],
    ["FREEZE", Snow, "muted"],
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
