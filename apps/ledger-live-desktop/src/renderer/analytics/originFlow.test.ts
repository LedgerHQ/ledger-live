import type * as OriginFlowModule from "./originFlow";

let getOriginFlow: typeof OriginFlowModule.getOriginFlow;
let setOriginFlow: typeof OriginFlowModule.setOriginFlow;

describe("originFlow (singleton)", () => {
  beforeAll(() => {
    jest.resetModules();
    jest.isolateModules(() => {
      const originFlow = jest.requireActual<typeof OriginFlowModule>(
        "src/renderer/analytics/originFlow",
      );
      getOriginFlow = originFlow.getOriginFlow;
      setOriginFlow = originFlow.setOriginFlow;
    });
  });

  afterEach(() => {
    setOriginFlow("");
  });

  it("returns empty string initially", () => {
    expect(getOriginFlow()).toBe("");
  });

  it("returns value after setOriginFlow", () => {
    setOriginFlow("Manager Dashboard");
    expect(getOriginFlow()).toBe("Manager Dashboard");
  });

  it("replaces existing value", () => {
    setOriginFlow("Send Modal");
    setOriginFlow("Receive Modal");
    expect(getOriginFlow()).toBe("Receive Modal");
  });
});
