import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getEnv, setEnv, setEnvUnsafe, changes } from ".";

describe("@shared/live-env", () => {
  describe("getEnv", () => {
    it("returns typed default values", () => {
      expect(getEnv("MOCK")).toBe(""); // string seed, empty by default
      expect(getEnv("GET_CALLS_TIMEOUT")).toBe(60 * 1000);
      expect(getEnv("CAL_SERVICE_URL")).toBe("https://global.api.prd.ledger.com/cal");
      expect(Array.isArray(getEnv("NFT_CURRENCIES"))).toBe(true);
    });
  });

  describe("setEnv", () => {
    let original: string;
    beforeEach(() => {
      original = getEnv("MOCK");
    });
    afterEach(() => {
      setEnv("MOCK", original);
    });

    it("updates the value", () => {
      setEnv("MOCK", "test-seed");
      expect(getEnv("MOCK")).toBe("test-seed");
    });
  });

  describe("setEnvUnsafe", () => {
    let original: string;
    beforeEach(() => {
      original = getEnv("MOCK");
    });
    afterEach(() => {
      setEnv("MOCK", original);
    });

    it("accepts a valid string value", () => {
      expect(setEnvUnsafe("MOCK", "test-seed")).toBe(true);
      expect(getEnv("MOCK")).toBe("test-seed");
    });

    it("rejects an unknown key", () => {
      expect(setEnvUnsafe("UNKNOWN_KEY_XYZ", "anything")).toBe(false);
    });

    it("rejects an invalid value (returns false, does not throw)", () => {
      // stringParser returns undefined for non-string values
      expect(setEnvUnsafe("CAL_SERVICE_URL", 12345)).toBe(false);
    });
  });

  describe("changes", () => {
    let original: string;
    beforeEach(() => {
      original = getEnv("MOCK");
    });
    afterEach(() => {
      setEnv("MOCK", original);
    });

    it("notifies subscribers on value change", () => {
      const received: unknown[] = [];
      const sub = changes.subscribe(({ name, value }) => {
        if (name === "MOCK") received.push(value);
      });
      setEnv("MOCK", "seed-a");
      setEnv("MOCK", "seed-b");
      sub.unsubscribe();
      expect(received).toEqual(["seed-a", "seed-b"]);
    });

    it("stops notifying after unsubscribe", () => {
      const received: unknown[] = [];
      const sub = changes.subscribe(({ name, value }) => {
        if (name === "MOCK") received.push(value);
      });
      sub.unsubscribe();
      setEnv("MOCK", "seed-a");
      expect(received).toHaveLength(0);
    });

    it("does not notify when value is unchanged", () => {
      const received: unknown[] = [];
      const sub = changes.subscribe(() => received.push(1));
      const current = getEnv("MOCK");
      setEnv("MOCK", current); // same value — no-op
      sub.unsubscribe();
      expect(received).toHaveLength(0);
    });
  });
});
