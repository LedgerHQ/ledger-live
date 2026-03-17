/**
 * Unit tests for in-memory origin flow (setOriginFlow / getOriginFlow).
 * Used by Reborn Buy Device drawer and entry points for analytics source.
 */
import { getOriginFlow, setOriginFlow } from "../originFlow";

describe("originFlow", () => {
  afterEach(() => {
    setOriginFlow("");
  });

  it("should return empty string by default", () => {
    expect(getOriginFlow()).toBe("");
  });

  it("should return the value set by setOriginFlow", () => {
    setOriginFlow("Receive");
    expect(getOriginFlow()).toBe("Receive");
  });

  it("should overwrite previous value when setOriginFlow is called again", () => {
    setOriginFlow("Ledger Sync");
    expect(getOriginFlow()).toBe("Ledger Sync");
    setOriginFlow("Platform");
    expect(getOriginFlow()).toBe("Platform");
  });

  it("should allow empty string as value", () => {
    setOriginFlow("Fab Actions");
    setOriginFlow("");
    expect(getOriginFlow()).toBe("");
  });
});
