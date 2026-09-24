import { hasRouteNamed } from "./routePresence";

describe("spotting a route in the navigation state", () => {
  it("finds one at the top level", () => {
    expect(
      hasRouteNamed({ routes: [{ name: "Main" }, { name: "PasswordAddFlow" }] }, "PasswordAddFlow"),
    ).toBe(true);
  });

  it("finds one nested inside another navigator", () => {
    const state = {
      routes: [{ name: "Main", state: { routes: [{ name: "PasswordAddFlow" }] } }],
    };

    expect(hasRouteNamed(state, "PasswordAddFlow")).toBe(true);
  });

  it("says no when only other routes are mounted", () => {
    expect(hasRouteNamed({ routes: [{ name: "Main" }] }, "PasswordAddFlow")).toBe(false);
  });

  it("says no for a state the container has not produced yet", () => {
    expect(hasRouteNamed(undefined, "PasswordAddFlow")).toBe(false);
  });
});
