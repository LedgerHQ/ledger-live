import { lldFamilyLoaders } from "../loaders";
import { coinModalImports } from "../modals-loaders";

it("dry-imports every family chunk", async () => {
  const mods = await Promise.all(lldFamilyLoaders.map(l => l.importFamily()));
  mods.forEach(m => expect(m.default).toBeDefined());
});

it("dry-imports every modal chunk", async () => {
  const mods = await Promise.all(Object.values(coinModalImports).map(fn => fn()));
  mods.forEach(m => expect(m.default).toBeDefined());
});
