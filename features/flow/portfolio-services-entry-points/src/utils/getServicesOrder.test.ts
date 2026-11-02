import { getServicesOrder } from "./getServicesOrder";

describe("getServicesOrder", () => {
  it("should return the order set by the flag", () => {
    expect(getServicesOrder({ enabled: true, params: { services: ["borrow"] } })).toEqual([
      "borrow",
    ]);
  });

  it("should keep an explicitly empty order", () => {
    expect(getServicesOrder({ enabled: true, params: { services: [] } })).toEqual([]);
  });

  it("should fall back to the default order when the flag has no params", () => {
    expect(getServicesOrder({ enabled: true })).toEqual(["perps", "borrow"]);
  });

  it("should return no service when the flag is not loaded", () => {
    expect(getServicesOrder(null)).toEqual([]);
  });
});
