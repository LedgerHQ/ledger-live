import { z } from "zod";
import {
  createAggregator,
  type CloudSyncDataManager,
  type DistantDocument,
  type OnModuleError,
} from "../cloudSyncModule";

// a failing module must not cascade: others keep syncing and its distant data is preserved

type HealthyLocal = string[];
type HealthyDistant = string[];

function makeHealthyModule(): CloudSyncDataManager<
  HealthyLocal,
  HealthyDistant,
  z.ZodType<HealthyDistant>,
  HealthyDistant
> {
  return {
    schema: z.array(z.string()),
    diffLocalToDistant: (local, latest) => ({
      hasChanges: local.join() !== (latest ?? []).join(),
      nextState: local,
    }),
    resolveIncrementalUpdate: async (local, latest, incoming) => {
      if (!incoming || incoming.join() === (latest ?? []).join()) return { hasChanges: false };
      if (incoming.join() === local.join()) return { hasChanges: false };
      return { hasChanges: true, update: incoming };
    },
    applyUpdate: (_local, update) => update,
  };
}

type PoisonBehaviour = {
  /** throws synchronously from diffLocalToDistant */
  diffThrows?: boolean;
  /** throws synchronously from resolveIncrementalUpdate (before returning a promise) */
  resolveThrowsSync?: boolean;
  /** returns a rejected promise from resolveIncrementalUpdate */
  resolveRejects?: boolean;
  /** throws synchronously from applyUpdate */
  applyThrows?: boolean;
};

/** A module whose schema only accepts `{ ok: true }`, and that can be made to throw on demand. */
function makePoisonModule(behaviour: PoisonBehaviour = {}) {
  const schema = z.object({ ok: z.literal(true) });
  type Distant = z.infer<typeof schema>;
  const module: CloudSyncDataManager<Distant, Distant, typeof schema, Distant> = {
    schema,
    diffLocalToDistant: (local, latest) => {
      if (behaviour.diffThrows) throw new Error("poison: diffLocalToDistant");
      return { hasChanges: latest == null, nextState: local };
    },
    resolveIncrementalUpdate: (_local, _latest, incoming) => {
      if (behaviour.resolveThrowsSync) throw new Error("poison: resolveIncrementalUpdate sync");
      if (behaviour.resolveRejects) {
        return Promise.reject(new Error("poison: resolveIncrementalUpdate async"));
      }
      return Promise.resolve(
        incoming ? { hasChanges: true, update: incoming } : { hasChanges: false },
      );
    },
    applyUpdate: (local, update) => {
      if (behaviour.applyThrows) throw new Error("poison: applyUpdate");
      return update ?? local;
    },
  };
  return module;
}

function setup(behaviour: PoisonBehaviour = {}) {
  const onModuleError = jest.fn<ReturnType<OnModuleError>, Parameters<OnModuleError>>();
  const aggregator = createAggregator(
    {
      alpha: makeHealthyModule(),
      poison: makePoisonModule(behaviour),
      omega: makeHealthyModule(),
    },
    { onModuleError },
  );
  const localState = { alpha: ["a"], poison: { ok: true as const }, omega: ["o"] };
  return { aggregator, onModuleError, localState };
}

/** a distant state where the poison module's slice does not match its schema */
const garbageDistant = {
  alpha: ["a-distant"],
  poison: { ok: "definitely not a boolean", extra: [1, 2, 3] },
  omega: ["o-distant"],
  futureModule: { written: "by a newer app version" },
};

describe("createAggregator module isolation", () => {
  describe("a distant slice that fails its module schema", () => {
    it("does not stop the other modules from diffing", () => {
      const { aggregator, localState } = setup();
      const result = aggregator.diffLocalToDistant(localState, garbageDistant);
      expect(result.hasChanges).toBe(true);
      expect(result.nextState.alpha).toEqual(["a"]);
      expect(result.nextState.omega).toEqual(["o"]);
    });

    it("preserves the unparseable slice verbatim instead of erasing or overwriting it", () => {
      const { aggregator, localState } = setup();
      const result = aggregator.diffLocalToDistant(localState, garbageDistant);
      expect(result.nextState.poison).toEqual({
        ok: "definitely not a boolean",
        extra: [1, 2, 3],
      });
    });

    it("still preserves keys written by newer app versions", () => {
      const { aggregator, localState } = setup();
      const result = aggregator.diffLocalToDistant(localState, garbageDistant);
      expect(result.nextState.futureModule).toEqual({
        written: "by a newer app version",
      });
    });

    it("reports the failing module", () => {
      const { aggregator, onModuleError, localState } = setup();
      aggregator.diffLocalToDistant(localState, garbageDistant);
      expect(onModuleError).toHaveBeenCalledTimes(1);
      expect(onModuleError.mock.calls[0][0]).toBe("poison");
      expect(onModuleError.mock.calls[0][1]).toBeDefined();
    });

    it("reports a sticky quarantine only once, not on every poll", async () => {
      const { aggregator, onModuleError, localState } = setup();
      for (let i = 0; i < 5; i++) {
        aggregator.diffLocalToDistant(localState, garbageDistant);
        await aggregator.resolveIncrementalUpdate(localState, garbageDistant, garbageDistant);
      }
      expect(onModuleError).toHaveBeenCalledTimes(1);
    });

    it("still reports a module that later starts failing a different way", () => {
      const onModuleError = jest.fn<ReturnType<OnModuleError>, Parameters<OnModuleError>>();
      let mode: "schema" | "throw" = "schema";
      const flakySchema = z.object({ ok: z.literal(true) });
      type FlakyState = z.infer<typeof flakySchema>;
      const flaky: CloudSyncDataManager<FlakyState, FlakyState, typeof flakySchema, FlakyState> = {
        schema: flakySchema,
        diffLocalToDistant: local => {
          if (mode === "throw") throw new Error("a completely different failure");
          return { hasChanges: false, nextState: local };
        },
        resolveIncrementalUpdate: async () => ({ hasChanges: false }),
        applyUpdate: local => local,
      };
      const aggregator = createAggregator({ flaky }, { onModuleError });
      const local = { flaky: { ok: true as const } };

      aggregator.diffLocalToDistant(local, { flaky: "garbage" });
      expect(onModuleError).toHaveBeenCalledTimes(1);

      mode = "throw";
      aggregator.diffLocalToDistant(local, { flaky: { ok: true } });
      expect(onModuleError).toHaveBeenCalledTimes(2);
      expect(onModuleError.mock.calls[1][1]).toEqual(expect.any(Error));
    });

    // guards the seeding spread: Object.assign semantics would drop this key and move the
    // prototype instead, so a downlevelled build would fail here rather than silently lose data
    it("preserves a distant key named __proto__ without touching the prototype chain", () => {
      const { aggregator, localState } = setup();
      const distant = JSON.parse('{"__proto__": {"polluted": true}}');
      distant.alpha = ["a-distant"];
      distant.omega = ["o-distant"];

      const { nextState } = aggregator.diffLocalToDistant(localState, distant);

      expect(Object.prototype.hasOwnProperty.call(nextState, "__proto__")).toBe(true);
      expect(Object.getPrototypeOf(nextState)).toBe(Object.prototype);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(nextState.alpha).toEqual(["a"]);
    });

    it("lets the other modules resolve an incoming update", async () => {
      const { aggregator, localState } = setup();
      const result = await aggregator.resolveIncrementalUpdate(localState, null, garbageDistant);
      expect(result.hasChanges).toBe(true);
      if (!result.hasChanges) return;
      expect(result.update.alpha).toEqual({ hasChanges: true, update: ["a-distant"] });
      expect(result.update.omega).toEqual({ hasChanges: true, update: ["o-distant"] });
      expect(result.update.poison).toEqual({ hasChanges: false });
    });

    it("does not erase the healthy modules' distant keys (data-loss regression)", () => {
      const { aggregator, localState } = setup();
      const { nextState } = aggregator.diffLocalToDistant(localState, garbageDistant);
      const keys = Object.keys(nextState as Record<string, unknown>).sort();
      expect(keys).toEqual(["alpha", "futureModule", "omega", "poison"]);
    });

    it("survives a distant state that is not even shaped like a state object", async () => {
      const { aggregator, localState } = setup();
      for (const garbage of [
        { alpha: 42, poison: "nope", omega: null },
        { alpha: null, poison: undefined, omega: ["o-distant"] },
        {},
      ]) {
        expect(() => aggregator.diffLocalToDistant(localState, garbage)).not.toThrow();
        await expect(
          aggregator.resolveIncrementalUpdate(localState, null, garbage),
        ).resolves.toBeDefined();
      }
    });

    // a document arrives from the network or from storage, so its declared type is not trusted
    it("treats a document that is not an object as an absent one", async () => {
      const { aggregator, localState } = setup();
      const absent = aggregator.diffLocalToDistant(localState, null);
      for (const notADocument of [undefined, 42, "string", true, [], () => {}]) {
        const document = notADocument as unknown as DistantDocument;
        expect(aggregator.diffLocalToDistant(localState, document)).toEqual(absent);
        await expect(
          aggregator.resolveIncrementalUpdate(localState, document, document),
        ).resolves.toBeDefined();
      }
    });

    it("never reports a quarantine for a document that carries no slice at all", () => {
      const { aggregator, localState, onModuleError } = setup();
      aggregator.diffLocalToDistant(localState, 42 as unknown as DistantDocument);
      expect(onModuleError).not.toHaveBeenCalled();
    });
  });

  // a quarantine must be recoverable: an unreadable *latest* slice is only a missing baseline,
  // so it must not stop the module adopting a *incoming* slice that parses again
  describe("recovering from a quarantine", () => {
    it("applies a readable incoming slice even when the latest slice is unreadable", async () => {
      const { aggregator, localState } = setup();
      const resolved = await aggregator.resolveIncrementalUpdate(
        localState,
        { poison: "garbage from an older push" },
        { poison: { ok: true } },
      );

      expect(resolved.hasChanges).toBe(true);
      if (!resolved.hasChanges) return;
      expect(resolved.update.poison).toEqual({ hasChanges: true, update: { ok: true } });
    });

    it("still skips the module when the incoming slice is the unreadable one", async () => {
      const { aggregator, localState } = setup();
      const resolved = await aggregator.resolveIncrementalUpdate(
        localState,
        { poison: { ok: true } },
        { poison: "garbage" },
      );

      if (resolved.hasChanges) expect(resolved.update.poison).toEqual({ hasChanges: false });
    });

    it("reports the unreadable latest slice even though it lets the incoming one through", async () => {
      const { aggregator, localState, onModuleError } = setup();
      await aggregator.resolveIncrementalUpdate(
        localState,
        { poison: "garbage" },
        { poison: { ok: true } },
      );
      expect(onModuleError).toHaveBeenCalledTimes(1);
      expect(onModuleError.mock.calls[0][0]).toBe("poison");
    });
  });

  describe("a module that throws", () => {
    it("diffLocalToDistant: keeps the other modules and falls back to the latest distant value", () => {
      const { aggregator, onModuleError, localState } = setup({ diffThrows: true });
      const latest = { alpha: ["a-distant"], poison: { ok: true as const }, omega: ["o-distant"] };
      const result = aggregator.diffLocalToDistant(localState, latest);
      expect(result.nextState.alpha).toEqual(["a"]);
      expect(result.nextState.omega).toEqual(["o"]);
      expect(result.nextState.poison).toEqual({ ok: true });
      expect(onModuleError).toHaveBeenCalledWith("poison", expect.any(Error));
    });

    it("diffLocalToDistant: throwing on a null latest state leaves no bogus value behind", () => {
      const { aggregator, localState } = setup({ diffThrows: true });
      const result = aggregator.diffLocalToDistant(localState, null);
      expect(result.nextState.alpha).toEqual(["a"]);
      expect(result.nextState.omega).toEqual(["o"]);
      expect(result.nextState.poison).toBeUndefined();
      expect(JSON.parse(JSON.stringify(result.nextState))).not.toHaveProperty("poison");
    });

    it("resolveIncrementalUpdate: a rejected module degrades to hasChanges=false", async () => {
      const { aggregator, onModuleError, localState } = setup({ resolveRejects: true });
      const incoming = {
        alpha: ["a-distant"],
        poison: { ok: true as const },
        omega: ["o-distant"],
      };
      const result = await aggregator.resolveIncrementalUpdate(localState, null, incoming);
      expect(result.hasChanges).toBe(true);
      if (!result.hasChanges) return;
      expect(result.update.poison).toEqual({ hasChanges: false });
      expect(result.update.alpha).toEqual({ hasChanges: true, update: ["a-distant"] });
      expect(result.update.omega).toEqual({ hasChanges: true, update: ["o-distant"] });
      expect(onModuleError).toHaveBeenCalledWith("poison", expect.any(Error));
    });

    it("resolveIncrementalUpdate: a synchronous throw is caught like a rejection", async () => {
      const { aggregator, onModuleError, localState } = setup({ resolveThrowsSync: true });
      const incoming = {
        alpha: ["a-distant"],
        poison: { ok: true as const },
        omega: ["o-distant"],
      };
      const result = await aggregator.resolveIncrementalUpdate(localState, null, incoming);
      expect(result.hasChanges).toBe(true);
      if (!result.hasChanges) return;
      expect(result.update.poison).toEqual({ hasChanges: false });
      expect(onModuleError).toHaveBeenCalledWith("poison", expect.any(Error));
    });

    it("resolveIncrementalUpdate: a rejection alone never rejects the aggregate", async () => {
      const { aggregator, localState } = setup({ resolveRejects: true });
      const incoming = { alpha: ["a"], poison: { ok: true as const }, omega: ["o"] };
      await expect(
        aggregator.resolveIncrementalUpdate(localState, incoming, incoming),
      ).resolves.toEqual({ hasChanges: false });
    });

    it("applyUpdate: keeps the local state of the failing module and applies the others", () => {
      const { aggregator, onModuleError, localState } = setup({ applyThrows: true });
      const result = aggregator.applyUpdate(localState, {
        alpha: { hasChanges: true, update: ["a-new"] },
        poison: { hasChanges: true, update: { ok: true } },
        omega: { hasChanges: true, update: ["o-new"] },
      });
      expect(result.alpha).toEqual(["a-new"]);
      expect(result.omega).toEqual(["o-new"]);
      expect(result.poison).toBe(localState.poison);
      expect(onModuleError).toHaveBeenCalledWith("poison", expect.any(Error));
    });

    it("applyUpdate: tolerates an update object missing a module entry", () => {
      const { aggregator, localState } = setup();
      const result = aggregator.applyUpdate(localState, {
        alpha: { hasChanges: true, update: ["a-new"] },
      } as never);
      expect(result.alpha).toEqual(["a-new"]);
      expect(result.poison).toBe(localState.poison);
      expect(result.omega).toEqual(["o"]);
    });
  });

  describe("a full pull/push round trip with a poisoned module", () => {
    it("converges the healthy modules and round-trips the poisoned slice untouched", async () => {
      const { aggregator, localState } = setup();
      const resolved = await aggregator.resolveIncrementalUpdate(localState, null, garbageDistant);
      expect(resolved.hasChanges).toBe(true);
      if (!resolved.hasChanges) return;

      const newLocal = aggregator.applyUpdate(localState, resolved.update);
      expect(newLocal.alpha).toEqual(["a-distant"]);
      expect(newLocal.omega).toEqual(["o-distant"]);

      // what we would push back must still carry the poisoned and unknown slices as-is
      const { nextState } = aggregator.diffLocalToDistant(newLocal, garbageDistant);
      expect(nextState).toEqual(garbageDistant);
    });
  });

  it("hands modules their slice by reference, so identity short-circuits still work", async () => {
    const seen: unknown[] = [];
    const spyModule = {
      ...makeHealthyModule(),
      resolveIncrementalUpdate: async (_l: HealthyLocal, latest: unknown, incoming: unknown) => {
        seen.push(latest, incoming);
        return { hasChanges: false as const };
      },
    };
    const aggregator = createAggregator({ alpha: spyModule });
    const slice = ["a"];
    const state = { alpha: slice };
    await aggregator.resolveIncrementalUpdate({ alpha: ["a"] }, state, state);
    expect(seen[0]).toBe(slice);
    expect(seen[1]).toBe(slice);
  });

  // the package is platform-agnostic, so it reports only through onModuleError: touching console
  // both breaks consumers compiling its source with lib ES2022 and picks their alert severity
  it("quarantines silently, without touching the console, when no onModuleError is given", () => {
    const spies = (["error", "warn", "log", "info", "debug"] as const).map(level =>
      jest.spyOn(console, level).mockImplementation(() => {}),
    );
    try {
      const aggregator = createAggregator({ poison: makePoisonModule() });
      const { nextState } = aggregator.diffLocalToDistant(
        { poison: { ok: true } },
        { poison: "garbage" },
      );
      expect(nextState.poison).toBe("garbage");
      spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
    } finally {
      spies.forEach(spy => spy.mockRestore());
    }
  });

  // a report reaches Datadog, so it must never carry synced data. A zod message is its issues
  // serialized, and an issue path is a record key -- for accountNames that key is an account id
  // carrying the xpub.
  describe("reported errors carry no synced content", () => {
    const ACCOUNT_ID = "js:2:bitcoin:xpub6CUGRUonZSQ4TWtTMmzXd7feUVBJvSEyLEAKEDXPUB:native_segwit";
    const ADDRESS = "bc1qLEAKEDADDRESS0000";

    /** everything a sink could reach: message, stack, own props, cause chain */
    function fullyExposed(error: unknown): string {
      const seen = new Set<unknown>();
      const parts: string[] = [];
      let current: unknown = error;
      while (current instanceof Error && !seen.has(current)) {
        seen.add(current);
        parts.push(current.name, current.message, current.stack ?? "");
        parts.push(JSON.stringify(current, Object.getOwnPropertyNames(current)));
        current = (current as { cause?: unknown }).cause;
      }
      parts.push(String(error), JSON.stringify(error));
      return parts.join("\n");
    }

    /** mirrors accountNames: a record keyed by account id, so the key lands in the issue path */
    const namesModule: CloudSyncDataManager<
      Record<string, string>,
      Record<string, string>,
      z.ZodType<Record<string, string>>,
      Record<string, string>
    > = {
      schema: z.record(z.string(), z.string()),
      diffLocalToDistant: local => ({ hasChanges: false, nextState: local }),
      resolveIncrementalUpdate: async () => ({ hasChanges: false }),
      applyUpdate: (_local, update) => update,
    };

    it("omits the account id and address from a schema rejection", () => {
      const onModuleError = jest.fn<ReturnType<OnModuleError>, Parameters<OnModuleError>>();
      const aggregator = createAggregator({ names: namesModule }, { onModuleError });

      // a number value rejects the slice, putting the account id in the issue path
      const distant = { names: { [ACCOUNT_ID]: 42, other: ADDRESS } };
      aggregator.diffLocalToDistant({ names: {} }, distant);

      expect(onModuleError).toHaveBeenCalledTimes(1);
      const [moduleKey, reported] = onModuleError.mock.calls[0];
      expect(moduleKey).toBe("names");

      const exposed = fullyExposed(reported);
      expect(exposed).not.toContain("LEAKEDXPUB");
      expect(exposed).not.toContain(ACCOUNT_ID);
      expect(exposed).not.toContain(ADDRESS);
      // the useful part survives: which module, and what kind of failure
      expect(reported.moduleKey).toBe("names");
      expect(reported.reason).toBe("ZodError(invalid_type)");
      expect(reported.cause).toBeUndefined();
    });

    it("omits the thrown error's message when a module throws", () => {
      const onModuleError = jest.fn<ReturnType<OnModuleError>, Parameters<OnModuleError>>();
      const thrower: CloudSyncDataManager<string[], string[], z.ZodType<string[]>, string[]> = {
        schema: z.array(z.string()),
        diffLocalToDistant: () => {
          throw new TypeError(`cannot read ${ACCOUNT_ID}`);
        },
        resolveIncrementalUpdate: async () => ({ hasChanges: false }),
        applyUpdate: (_local, update) => update,
      };
      const aggregator = createAggregator({ thrower }, { onModuleError });
      aggregator.diffLocalToDistant({ thrower: [] }, null);

      const [, reported] = onModuleError.mock.calls[0];
      expect(fullyExposed(reported)).not.toContain("LEAKEDXPUB");
      expect(reported.reason).toBe("TypeError");
    });

    it("keeps the quarantine message itself payload-free", () => {
      const onModuleError = jest.fn<ReturnType<OnModuleError>, Parameters<OnModuleError>>();
      const aggregator = createAggregator({ names: namesModule }, { onModuleError });
      aggregator.diffLocalToDistant({ names: {} }, { names: { [ACCOUNT_ID]: 42 } });

      // the message is what a consumer is most likely to log verbatim
      const [, reported] = onModuleError.mock.calls[0];
      expect(reported.message).not.toContain("LEAKEDXPUB");
      expect(reported.message).not.toContain(ACCOUNT_ID);
    });
  });
});
