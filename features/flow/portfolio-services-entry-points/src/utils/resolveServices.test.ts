import { resolveServices } from "./resolveServices";

const allAvailable = { perps: true, borrow: true };

describe("resolveServices", () => {
  it("should keep the order set by the flag", () => {
    expect(resolveServices(["borrow", "perps"], allAvailable)).toEqual(["borrow", "perps"]);
  });

  it("should drop services that are not available", () => {
    expect(resolveServices(["perps", "borrow"], { perps: false, borrow: true })).toEqual([
      "borrow",
    ]);
  });

  it("should drop unknown ids coming from the remote config", () => {
    expect(resolveServices(["swap", "perps", 42], allAvailable)).toEqual(["perps"]);
  });

  it("should drop duplicate ids", () => {
    expect(resolveServices(["perps", "perps", "borrow"], allAvailable)).toEqual([
      "perps",
      "borrow",
    ]);
  });

  it("should return no service when the order is missing", () => {
    expect(resolveServices(undefined, allAvailable)).toEqual([]);
  });
});
