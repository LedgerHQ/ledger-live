import reducer, {
  setOriginFlow,
  selectOriginFlow,
  type OriginFlowState,
} from "./originFlow";

describe("originFlow reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "unknown" })).toBe("");
  });

  it("should set origin flow with setOriginFlow", () => {
    const state = reducer("", setOriginFlow("Manager Dashboard"));
    expect(state).toBe("Manager Dashboard");
  });

  it("should replace existing origin flow", () => {
    const state = reducer("Send Modal", setOriginFlow("Receive Modal"));
    expect(state).toBe("Receive Modal");
  });
});

describe("selectOriginFlow", () => {
  const buildState = (originFlow: OriginFlowState) => ({ originFlow });

  it("should return empty string when origin flow is not set", () => {
    expect(selectOriginFlow(buildState(""))).toBe("");
  });

  it("should return the current origin flow", () => {
    expect(selectOriginFlow(buildState("Ledger Sync"))).toBe("Ledger Sync");
    expect(selectOriginFlow(buildState("Manager Dashboard"))).toBe("Manager Dashboard");
  });
});
