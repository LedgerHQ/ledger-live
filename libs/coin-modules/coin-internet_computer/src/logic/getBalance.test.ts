import { ICP_NETWORK_URL } from "../consts";
import { queryBalance } from "../network/api";
import { getBalance } from "./getBalance";

jest.mock("../network/api", () => ({ queryBalance: jest.fn() }));

const mockQueryBalance = jest.mocked(queryBalance);

afterEach(() => jest.resetAllMocks());

describe("getBalance", () => {
  it("returns the native balance alone", async () => {
    mockQueryBalance.mockResolvedValue(123_000n);
    expect(await getBalance(ICP_NETWORK_URL, "addr")).toEqual([
      { value: 123_000n, asset: { type: "native" } },
    ]);
    expect(mockQueryBalance).toHaveBeenCalledWith(ICP_NETWORK_URL, "addr");
  });

  it("throws rather than report 0 when the index does not answer", async () => {
    mockQueryBalance.mockResolvedValue(undefined);
    await expect(getBalance(ICP_NETWORK_URL, "addr")).rejects.toThrow(/Balance query failed/);
  });
});
