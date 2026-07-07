import { z } from "zod";
import { flag, flagWith, flagWithRecord } from "./define";
import { getFlagMeta, type FlagMeta } from "./meta";
import { flagRegistry } from "./data/schema";
import { FEATURE_FLAGS_DEFAULTS } from "./constants";

const sampleMeta: FlagMeta = {
  description: "Test flag used only in unit tests.",
  status: "experiment",
  owner: "wallet-xp",
  ticket: "LIVE-0000",
  dependsOn: ["someOtherFlag"],
  paramsDoc: { color: "The theme color." },
};

describe("feature-flags metadata layer", () => {
  describe("zero runtime impact on resolved values", () => {
    it("flag(): default value is identical with and without meta", () => {
      const withoutMeta = flag({ enabled: true });
      const withMeta = flag({ enabled: true }, sampleMeta);
      expect(withMeta.parse(undefined)).toEqual(withoutMeta.parse(undefined));
    });

    it("flagWith(): default value is identical with and without meta", () => {
      const params = { color: z.string() };
      const defaults = { enabled: true, params: { color: "blue" } };
      const withoutMeta = flagWith(params, defaults);
      const withMeta = flagWith(params, defaults, sampleMeta);
      expect(withMeta.parse(undefined)).toEqual(withoutMeta.parse(undefined));
    });

    it("flagWithRecord(): default value is identical with and without meta", () => {
      const paramsSchema = z.record(z.string(), z.boolean());
      const defaults = { enabled: true, params: { a: true } };
      const withoutMeta = flagWithRecord(paramsSchema, defaults);
      const withMeta = flagWithRecord(paramsSchema, defaults, sampleMeta);
      expect(withMeta.parse(undefined)).toEqual(withoutMeta.parse(undefined));
    });

    it("does not leak metadata keys into the resolved value", () => {
      const parsed = flag({ enabled: true }, sampleMeta).parse(undefined) as Record<string, unknown>;
      expect(parsed).toEqual({ enabled: true });
      expect(parsed).not.toHaveProperty("description");
      expect(parsed).not.toHaveProperty("status");
      expect(parsed).not.toHaveProperty("meta");
    });
  });

  describe("getFlagMeta", () => {
    it("returns the registered meta for a flag defined with meta", () => {
      const schema = flag({ enabled: false }, sampleMeta);
      expect(getFlagMeta(schema)).toEqual(sampleMeta);
    });

    it("returns undefined for a flag defined without meta", () => {
      const schema = flag({ enabled: false });
      expect(getFlagMeta(schema)).toBeUndefined();
    });

    it("registration returns the same schema instance the registry is keyed on", () => {
      // Guards the core design invariant: `.register()` must return the same instance stored in
      // `flagRegistry`, or metadata lookups from the tooling would miss.
      const schema = flagWith({ color: z.string() }, { enabled: true }, sampleMeta);
      expect(getFlagMeta(schema)).toEqual(sampleMeta);
    });
  });

  describe("real flag registry", () => {
    const entries = Object.entries(flagRegistry) as [string, z.ZodType][];
    const defaults = FEATURE_FLAGS_DEFAULTS as unknown as Record<string, Record<string, unknown>>;

    it("never leaks metadata into any resolved default", () => {
      for (const [id] of entries) {
        expect(defaults[id]).not.toHaveProperty("description");
        expect(defaults[id]).not.toHaveProperty("status");
        expect(defaults[id]).not.toHaveProperty("paramsDoc");
      }
    });

    it("any registered meta is well-formed", () => {
      for (const [, schema] of entries) {
        const meta = getFlagMeta(schema);
        if (meta) {
          expect(typeof meta.description).toBe("string");
          expect(meta.description.length).toBeGreaterThan(0);
          expect(["experiment", "rollout", "permanent", "deprecated"]).toContain(meta.status);
        }
      }
    });
  });
});
