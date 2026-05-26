import { getEnv } from "@ledgerhq/live-env";
import { lastBlock } from "./lastBlock";

const FILECOIN_API = "https://filecoin.coin.ledger.com";

jest.mock("@ledgerhq/live-env");
jest.mocked(getEnv).mockImplementation((key: string) => {
  if (key === "API_FILECOIN_ENDPOINT") return FILECOIN_API;
  return "" as any;
});

describe("lastBlock (integration)", () => {
  it("returns a valid BlockInfo with height > 0", async () => {
    const result = await lastBlock();

    expect(result.height).toBeGreaterThan(0);
    expect(typeof result.hash).toBe("string");
    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
