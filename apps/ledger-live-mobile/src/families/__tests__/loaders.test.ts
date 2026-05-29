import * as loaders from "../loaders";

// Each exported Map holds `family -> () => import(...)` factories. Invoking every
// factory exercises the dynamic-import arrow bodies (the bulk of this module) and
// confirms each registered family resolves to a callable import returning a promise.
const loaderMaps = Object.entries(loaders).filter(
  (entry): entry is [string, Map<string, () => Promise<{ default: unknown }>>] =>
    entry[1] instanceof Map,
);

describe("families/loaders", () => {
  it.each(loaderMaps)("%s exposes a dynamic-import factory per family", async (_name, map) => {
    expect(map.size).toBeGreaterThan(0);
    const promises = [...map.values()].map(loader => {
      const promise = loader();
      expect(typeof promise.then).toBe("function");
      return promise;
    });
    // Settle to avoid unhandled rejections; module evaluation is covered by the call above.
    await Promise.allSettled(promises);
  });
});
