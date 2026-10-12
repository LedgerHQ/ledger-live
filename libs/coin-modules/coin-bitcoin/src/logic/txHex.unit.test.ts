import { fakeExplorer } from "../test/fakeExplorer";
import { getTxHex } from "./txHex";

describe("getTxHex", () => {
  it("fetches a transaction once", async () => {
    const explorer = fakeExplorer({ txHex: { a: "00" } });
    expect(await getTxHex(explorer, "a")).toBe("00");
    expect(await getTxHex(explorer, "a")).toBe("00");
    expect(explorer.getTxHex).toHaveBeenCalledTimes(1);
  });
});
