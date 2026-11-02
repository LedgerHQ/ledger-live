import { tools } from "@devtools/registry";

const toolSourceDirs = Object.keys(tools).map(id => `/devtools/${id}/src/`);

function modulesLoadedBy(load: () => unknown): string[] {
  let loaded: string[] = [];
  jest.isolateModules(() => {
    load();
    loaded = Object.keys(require.cache);
  });
  return loaded;
}

describe("lazy contract", () => {
  it("importing @devtools/bindings evaluates no tool package", () => {
    const loaded = modulesLoadedBy(() => require("@devtools/bindings"));

    expect(loaded).toContain(require.resolve("@devtools/bindings"));
    expect(loaded.filter(path => toolSourceDirs.some(dir => path.includes(dir)))).toEqual([]);
  });
});
