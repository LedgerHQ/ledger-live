import { queryBalance } from "../network/api";
import { getBalance } from "./getBalance";

const LOCAL_NODE = "http://127.0.0.1:4943";

jest.mock("../network/api", () => ({ queryBalance: jest.fn() }));

const mockQueryBalance = jest.mocked(queryBalance);

afterEach(() => jest.resetAllMocks());

describe("getBalance", () => {
  it("returns the native balance alone", async () => {
    mockQueryBalance.mockResolvedValue(123_000n);
    expect(await getBalance(LOCAL_NODE, "addr")).toEqual([
      { value: 123_000n, asset: { type: "native" } },
    ]);
    expect(mockQueryBalance).toHaveBeenCalledWith(LOCAL_NODE, "addr");
  });

  it("throws rather than report 0 when the index does not answer", async () => {
    mockQueryBalance.mockResolvedValue(undefined);
    await expect(getBalance(LOCAL_NODE, "addr")).rejects.toThrow(/Balance query failed/);
  });
});
