import { getBlock } from "./getBlock";

describe("getBlock", () => {
  it("is not supported", async () => {
    await expect(getBlock(1)).rejects.toThrow("getBlock is not supported");
  });
});
