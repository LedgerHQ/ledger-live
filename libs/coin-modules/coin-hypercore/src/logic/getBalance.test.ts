import { getBalance } from "./getBalance";
import { fetchSpotClearinghouseState } from "../network/info";
import coinConfig from "../config";

jest.mock("../network/info");
const mockedFetch = jest.mocked(fetchSpotClearinghouseState);

beforeAll(() => {
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    infoUrl: "https://api.hyperliquid.xyz/info",
  }));
});

describe("getBalance", () => {
  it("returns the native HYPE balance with locked = hold (in base units)", async () => {
    mockedFetch.mockResolvedValueOnce({
      balances: [
        { coin: "HYPE", token: 0, total: "12.34567890", hold: "0.10000000", entryNtl: "0" },
        { coin: "USDC", token: 1, total: "100.00", hold: "0", entryNtl: "0" },
      ],
    });

    const balances = await getBalance("0xabc");

    expect(balances).toEqual([
      {
        value: 1234567890n,
        asset: {
          type: "native",
          name: "HYPE",
          unit: { name: "HYPE", code: "HYPE", magnitude: 8 },
        },
        locked: 10000000n,
      },
    ]);
  });

  it("returns a zero native balance when the address has no HYPE entry", async () => {
    mockedFetch.mockResolvedValueOnce({ balances: [] });

    const balances = await getBalance("0xdef");

    expect(balances).toEqual([
      {
        value: 0n,
        asset: {
          type: "native",
          name: "HYPE",
          unit: { name: "HYPE", code: "HYPE", magnitude: 8 },
        },
        locked: 0n,
      },
    ]);
  });

  it("truncates fractional digits beyond 8 decimals", async () => {
    mockedFetch.mockResolvedValueOnce({
      balances: [
        { coin: "HYPE", token: 0, total: "1.123456789999", hold: "0", entryNtl: "0" },
      ],
    });

    const [balance] = await getBalance("0xabc");

    expect(balance.value).toEqual(112345678n);
  });
});
