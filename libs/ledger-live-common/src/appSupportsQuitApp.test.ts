import appSupportsQuitApp, { minAppVersion } from "./appSupportsQuitApp";

test("appSupportsQuitApp - Apps that are listed fail if version is lt", () => {
  expect(
    appSupportsQuitApp({
      name: "Wanchain",
      version: "1.0.0",
      flags: 0,
    }),
  ).toBeFalsy();
});
test("appSupportsQuitApp - Apps that are listed pass if version is gte", () => {
  expect(
    appSupportsQuitApp({
      name: "Wanchain",
      version: "1.4.0",
      flags: 0,
    }),
  ).toBeTruthy();
});
test("appSupportsQuitApp - Apps that are not listed pass the test", () => {
  expect(
    appSupportsQuitApp({
      name: "FakeAppName",
      version: "1.2.3",
      flags: 0,
    }),
  ).toBeTruthy();
});
test("minAppVersion - Sonic and Ethereum have the same min app version", () => {
  expect(minAppVersion["Sonic"]).toBeDefined();
  expect(minAppVersion["Ethereum"]).toBeDefined();
  expect(minAppVersion["Sonic"]).toBe(minAppVersion["Ethereum"]);
});
