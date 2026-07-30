import { authEnvironmentReducer, authEnvironmentSelector, setAuthEnvironment } from "./slice";

describe("auth environment", () => {
  it("should initialize without an environment", () => {
    expect(authEnvironmentReducer(undefined, { type: "unknown" })).toBeNull();
  });

  it("should replace the current environment", () => {
    const stagingState = authEnvironmentReducer(undefined, setAuthEnvironment("STAGING"));
    const prodState = authEnvironmentReducer(stagingState, setAuthEnvironment("PROD"));

    expect(prodState).toBe("PROD");
    expect(authEnvironmentSelector({ authEnvironment: prodState })).toBe("PROD");
  });

  it("should match generated environment actions", () => {
    expect(setAuthEnvironment.match(setAuthEnvironment("STAGING"))).toBe(true);
    expect(setAuthEnvironment.match({ type: "unknown" })).toBe(false);
  });
});
