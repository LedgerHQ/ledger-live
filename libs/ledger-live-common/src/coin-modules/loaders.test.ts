import { coinModuleLoaders } from "./loaders";

describe("coinModuleLoaders smoke test", () => {
  for (const loader of coinModuleLoaders) {
    const entries = Object.entries(loader).flatMap(([k, fn]) =>
      k !== "family" && typeof fn === "function" ? [[k, fn] as const] : [],
    );
    for (const [method, fn] of entries) {
      it(`${loader.family}.${method}`, () => {
        expect(() => fn()).not.toThrow();
      });
    }
  }
});
