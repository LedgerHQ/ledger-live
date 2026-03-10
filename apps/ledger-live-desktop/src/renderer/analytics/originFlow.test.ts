import { getOriginFlow, setOriginFlow } from "./originFlow";

describe("originFlow (singleton)", () => {
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
