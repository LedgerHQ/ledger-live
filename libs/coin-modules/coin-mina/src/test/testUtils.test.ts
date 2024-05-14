import { getRandomTransferID } from "./testUtils";

describe("testUtils", () => {
  it("getRandomTransferID", () => {
    const id = getRandomTransferID();
    expect(id).toBeDefined();
    expect(id.length).toBeGreaterThan(0);
  });
});
