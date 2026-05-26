import { getEnv } from "@ledgerhq/live-env";
import { getBalance } from "./getBalance";

const FILECOIN_API = "https://filecoin.coin.ledger.com";

jest.mock("@ledgerhq/live-env");
jest.mocked(getEnv).mockImplementation((key: string) => {
  if (key === "API_FILECOIN_ENDPOINT") return FILECOIN_API;
  return "" as any;
});

describe("getBalance (integration)", () => {
  // f1 address of the Filecoin foundation — always funded
  const FUNDED_ADDRESS = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";

  it("returns Balance[] with a bigint value", async () => {
    const result = await getBalance(FUNDED_ADDRESS);

    expect(result).toHaveLength(1);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(typeof result[0].value).toBe("bigint");
    expect(result[0].value).toBeGreaterThanOrEqual(0n);
  });
});
