import { makeTestApi, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { getBalance } from "./getBalance";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

describe("getBalance (integ, Cosmos Hub)", () => {
  it("returns a native balance with the expected shape for a known funded address", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);

    const balances = await getBalance(api, ADDR);

    const native = balances.find(b => b.asset.type === "native");
    expect(native).not.toBeUndefined();
    expect(typeof native!.value).toBe("bigint");
    expect(native!.value >= 0n).toBe(true);
  });
});
