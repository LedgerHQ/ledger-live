import { coinModuleLoaders } from "./loaders";

describe("coinModuleLoaders smoke test", () => {
  for (const loader of coinModuleLoaders) {
    const entries = Object.entries(loader).filter(([k]) => k !== "family") as [
      string,
      () => unknown,
    ][];
    for (const [method, fn] of entries) {
      it(`${loader.family}.${method}`, () => {
        expect(() => fn()).not.toThrow();
      });
    }
  }
});
