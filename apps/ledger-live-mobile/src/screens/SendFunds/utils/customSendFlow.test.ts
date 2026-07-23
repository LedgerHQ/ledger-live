import { getCustomSendFlow } from "./customSendFlow";

jest.mock("~/generated/customSendFlow", () => ({
  __esModule: true,
  default: {
    aleo: {
      screens: [],
      buildSendEntrypoint: jest.fn(),
    },
  },
}));

describe("getCustomSendFlow", () => {
  it("returns null for unknown family", () => {
    expect(getCustomSendFlow("bitcoin")).toBeNull();
    expect(getCustomSendFlow("ethereum")).toBeNull();
    expect(getCustomSendFlow("")).toBeNull();
  });

  it("returns the flow object for a registered family", () => {
    const flow = getCustomSendFlow("aleo");

    expect(flow).not.toBeNull();
    expect(flow?.screens).toEqual([]);
  });
});
