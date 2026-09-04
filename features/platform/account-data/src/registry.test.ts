import { createAccountDataSourceRegistry } from "./registry";
import { fakeSource } from "./port.mock";

const low = fakeSource({ id: "legacy-bridge", priority: 0 });
const mid = fakeSource({ id: "coin-module-api", priority: 10 });
const high = fakeSource({ id: "a4", priority: 20 });

describe("createAccountDataSourceRegistry", () => {
  it("starts empty", () => {
    expect(createAccountDataSourceRegistry().list()).toEqual([]);
  });

  it("lists initial sources highest priority first", () => {
    const registry = createAccountDataSourceRegistry([low, high, mid]);
    expect(registry.list().map(source => source.id)).toEqual([
      "a4",
      "coin-module-api",
      "legacy-bridge",
    ]);
  });

  it("registers a source and unregisters it through the returned function", () => {
    const registry = createAccountDataSourceRegistry([low]);
    const unregister = registry.register(high);
    expect(registry.list()).toHaveLength(2);
    unregister();
    expect(registry.list().map(source => source.id)).toEqual(["legacy-bridge"]);
  });

  it("replaces a source registered under the same id", () => {
    const registry = createAccountDataSourceRegistry([mid]);
    const replacement = fakeSource({ id: "coin-module-api", priority: 99 });
    registry.register(replacement);
    expect(registry.list()).toEqual([replacement]);
  });

  it("does not let a stale unregister drop its replacement", () => {
    const registry = createAccountDataSourceRegistry();
    const unregisterFirst = registry.register(mid);
    const replacement = fakeSource({ id: "coin-module-api", priority: 99 });
    registry.register(replacement);
    unregisterFirst();
    expect(registry.list()).toEqual([replacement]);
  });
});
