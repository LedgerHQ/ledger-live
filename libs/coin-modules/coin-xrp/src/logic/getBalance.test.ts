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

  it("returns 0 balance and no locked amount for a new (inactive) account", async () => {
    mockGetAccountInfo.mockResolvedValue({
      isNewAccount: true,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    });

    const result = await getBalance("NEW_XRP_ACCOUNT");

    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(mockGetServerInfos).not.toHaveBeenCalled(); // important!
    expect(result).toEqual([{ value: 0n, locked: 0n, asset: { type: "native" } }]);
  });

  it("calculates locked amount correctly with trustlines", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: 20,
          reserve_inc_xrp: 5,
        },
      },
    });

    const balance = 100_000_000n;
    const trustlines = 3;

    mockGetAccountInfo.mockResolvedValue({
      isNewAccount: false,
      balance,
      ownerCount: trustlines,
      sequence: 1,
    });

    const result = await getBalance("ACCOUNT_WITH_TRUSTLINES");

    // Locked = 20 + (5 * 3) = 35 XRP = 35_000_000 drops
    expect(result).toEqual([
      {
        value: balance,
        asset: { type: "native" },
        locked: 35_000_000n,
      },
    ]);
  });

  it("returns 0 value with locked amount for an active account with 0 balance", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: 10,
          reserve_inc_xrp: 2,
        },
      },
    });

    mockGetAccountInfo.mockResolvedValue({
      isNewAccount: false,
      balance: "0",
      ownerCount: 0,
      sequence: 5,
    });

    const result = await getBalance("ZERO_BALANCE_ACTIVE_ACCOUNT");

    expect(result).toEqual([
      {
        value: 0n,
        asset: { type: "native" },
        locked: 10_000_000n,
      },
    ]);
  });
});
