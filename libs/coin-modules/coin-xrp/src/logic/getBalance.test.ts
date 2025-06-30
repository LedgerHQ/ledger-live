import { faker } from "@faker-js/faker";
import { getBalance } from "./getBalance";

const mockGetAccountInfo = jest.fn();
const mockGetServerInfos = jest.fn();
jest.mock("../network", () => ({
  getAccountInfo: (address: string) => mockGetAccountInfo(address),
  getServerInfos: () => mockGetServerInfos(),
}));

describe("getBalance", () => {
  afterEach(() => {
    mockGetAccountInfo.mockClear();
    mockGetServerInfos.mockClear();
  });

  it("returns the balance from Explorer", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: 23,
          reserve_inc_xrp: 5,
        },
      },
    });
    // Given
    const balance = faker.number.bigInt(100_000_000);
    const address = "ACCOUNT_ADDRESS";
    mockGetAccountInfo.mockResolvedValue({
      balance,
      ownerCount: 0,
    });

    // When
    const result = await getBalance(address);

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockGetAccountInfo.mock.lastCall[0]).toEqual(address);
    expect(result).toEqual([{ value: balance, asset: { type: "native" }, locked: 23000000n }]);
  });
});
