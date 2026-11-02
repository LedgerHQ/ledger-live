import { queryBalance } from "../network/api";
import { getBalance } from "./getBalance";

jest.mock("../network/api", () => ({ queryBalance: jest.fn() }));

const mockQueryBalance = jest.mocked(queryBalance);

afterEach(() => jest.resetAllMocks());

describe("getBalance", () => {
  it("returns the native balance alone", async () => {
    mockQueryBalance.mockResolvedValue(123_000n);
    expect(await getBalance("addr")).toEqual([{ value: 123_000n, asset: { type: "native" } }]);
  });

  it("throws rather than report 0 when the index does not answer", async () => {
    mockQueryBalance.mockResolvedValue(undefined);
    await expect(getBalance("addr")).rejects.toThrow(/Balance query failed/);
  });
});
