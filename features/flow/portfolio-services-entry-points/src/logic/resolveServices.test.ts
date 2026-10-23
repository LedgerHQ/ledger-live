import { resolveServices } from "./resolveServices";

const allAvailable = { perps: true, borrow: true };

describe("resolveServices", () => {
  it("keeps the order from the flag", () => {
    expect(resolveServices(["borrow", "perps"], allAvailable)).toEqual(["borrow", "perps"]);
  });

  it("drops services that are not available", () => {
    expect(resolveServices(["perps", "borrow"], { perps: false, borrow: true })).toEqual([
      "borrow",
    ]);
  });

  it("drops unknown ids and duplicates coming from the remote config", () => {
    expect(resolveServices(["swap", "perps", "perps", 42, "borrow"], allAvailable)).toEqual([
      "perps",
      "borrow",
    ]);
  });

  it("returns no service when the order is missing", () => {
    expect(resolveServices(undefined, allAvailable)).toEqual([]);
  });
});
