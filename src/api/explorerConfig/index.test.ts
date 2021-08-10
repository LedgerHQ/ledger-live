import { getExplorerConfig, preload, hydrate } from ".";
test("explorerConfig is an object", () => {
  expect(typeof getExplorerConfig).toBe("function");
  expect(typeof getExplorerConfig()).toBe("object");
});
test("preload loads something", async () => {
  const result = await preload();
  expect(result).toMatchObject({});
});
test("hydrate works with falsy value", async () => {
  hydrate();
});
test("hydrate works with an empty object", async () => {
  hydrate({});
});
