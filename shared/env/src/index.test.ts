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

  describe("mock server envs", () => {
    const defaultSession = getEnv("MOCK_SERVER_SESSION");

    afterEach(() => {
      setEnv("MOCK_SERVER_SESSION", defaultSession);
    });

    it("leaves MOCK_SERVER_SEED empty so the mock server's own seed applies", () => {
      expect(getEnv("MOCK_SERVER_SEED")).toBe("");
    });

    it("defaults MOCK_SERVER_SESSION to a single USB Stax on firmware 1.9.1", () => {
      expect(defaultSession).toEqual({
        devices: [
          {
            name: "Ledger Stax",
            device_type: "stax",
            connectivity_type: "USB",
            firmware_version: "1.9.1",
            apps: [{ name: "BOLOS", version: "1.4.0" }],
          },
        ],
      });
    });

    it("parses a MOCK_SERVER_SESSION override from a JSON string", () => {
      expect(setEnvUnsafe("MOCK_SERVER_SESSION", '{"devices":[{"device_type":"flex"}]}')).toBe(true);
      expect(getEnv("MOCK_SERVER_SESSION")).toEqual({ devices: [{ device_type: "flex" }] });
    });

    it("keeps the default when MOCK_SERVER_SESSION is not valid JSON", () => {
      expect(setEnvUnsafe("MOCK_SERVER_SESSION", "{oops")).toBe(false);
      expect(getEnv("MOCK_SERVER_SESSION")).toEqual(defaultSession);
    });
  });
});
