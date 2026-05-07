import { ArrowDown, Close } from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { getTransactionalDotConfig } from "../getTransactionalDotConfig";

describe("getTransactionalDotConfig", () => {
  it("resolves symbol strings to actual icon components", () => {
    expect(getTransactionalDotConfig("IN", false)).toEqual({
      icon: ArrowDown,
      appearance: "success",
    });
  });

  it("resolves Spinner for pending state", () => {
    expect(getTransactionalDotConfig("OUT", true)).toEqual({
      icon: Spinner,
      appearance: "muted",
    });
  });

  it("resolves Close for failed state", () => {
    expect(getTransactionalDotConfig("OUT", false, true)).toEqual({
      icon: Close,
      appearance: "error",
    });
  });

  it("returns null when common helper returns null", () => {
    expect(getTransactionalDotConfig("NONE", false)).toBeNull();
  });
});
