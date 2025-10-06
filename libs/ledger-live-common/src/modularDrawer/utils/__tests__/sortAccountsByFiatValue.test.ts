import { sortAccountsByFiatValue } from "../sortAccountsByFiatValue";
import { BaseRawDetailedAccount } from "../../types/detailedAccount";
import BigNumber from "bignumber.js";

const mockBalanceUnit = { name: "Ethereum", code: "ETH", magnitude: 18 };

const mockAccounts: BaseRawDetailedAccount[] = [
  {
    name: "Ethereum 1",
    id: "js:2:ethereum:0xaDf49b9f133fb137e82b24F06D23E49c51f586C7:",
    ticker: "ETH",
    balance: new BigNumber("1.55699"),
    balanceUnit: mockBalanceUnit,
    fiatValue: 4149.62,
    address: "0xaDf...586C7",
    cryptoId: "ethereum",
  },
  {
    name: "Ethereum 2",
    id: "js:2:ethereum:0xd4b6595ff5f3c21E0b00edB8947A31110a9c4B8f:",
    ticker: "ETH",
    balance: new BigNumber("0.178403"),
    balanceUnit: mockBalanceUnit,
    fiatValue: 475.47,
    address: "0xd4b...c4B8f",
    cryptoId: "ethereum",
  },
  {
    name: "Ethereum 3",
    id: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7:",
    ticker: "ETH",
    balance: new BigNumber("5.10589"),
    balanceUnit: mockBalanceUnit,
    fiatValue: 13607.93,
    address: "0x833...e33c7",
    cryptoId: "ethereum",
  },
  {
    name: "Ethereum 4",
    id: "js:2:ethereum:0xDbD543b0e80e0E73FbD49FDEe902FC59652753B9:",
    ticker: "ETH",
    balance: new BigNumber("0.00148572"),
    balanceUnit: mockBalanceUnit,
    fiatValue: 3.96,
    address: "0xDbD...753B9",
    cryptoId: "ethereum",
  },
];

const expectedSortedAccounts = [
  mockAccounts[2], // 13607.93
  mockAccounts[0], // 4149.62
  mockAccounts[1], // 475.47
  mockAccounts[3], // 3.96
];

describe("sortAccountsByFiatValue", () => {
  it("should sort accounts by fiat value in descending order", () => {
    const sortedAccounts = sortAccountsByFiatValue(mockAccounts);
    expect(sortedAccounts).toEqual(expectedSortedAccounts);
  });

  it("should handle empty accounts array", () => {
    const sortedAccounts = sortAccountsByFiatValue([]);
    expect(sortedAccounts).toEqual([]);
  });

  it("should handle accounts with identical fiat values", () => {
    const identicalAccounts = [
      { ...mockAccounts[0], fiatValue: 1000 },
      { ...mockAccounts[1], fiatValue: 1000 },
    ];
    const sortedAccounts = sortAccountsByFiatValue(identicalAccounts);
    expect(sortedAccounts).toEqual(identicalAccounts);
  });

  it("should handle accounts with zero fiat value", () => {
    const zeroBalanceAccounts = [
      { ...mockAccounts[0], fiatValue: 0 },
      { ...mockAccounts[1], fiatValue: 10000 },
    ];
    const sortedAccounts = sortAccountsByFiatValue(zeroBalanceAccounts);
    expect(sortedAccounts).toEqual([zeroBalanceAccounts[1], zeroBalanceAccounts[0]]);
  });

  it("should handle accounts with undefined fiat value", () => {
    const undefinedFiatAccounts = [
      { ...mockAccounts[0], fiatValue: undefined as any },
      { ...mockAccounts[1], fiatValue: 5000 },
    ];
    const sortedAccounts = sortAccountsByFiatValue(undefinedFiatAccounts);
    expect(sortedAccounts).toEqual([undefinedFiatAccounts[1], undefinedFiatAccounts[0]]);
  });

  it("should not mutate the original array", () => {
    const originalAccounts = [...mockAccounts];
    const sortedAccounts = sortAccountsByFiatValue(mockAccounts);

    expect(mockAccounts).toEqual(originalAccounts);
    expect(sortedAccounts).not.toBe(mockAccounts);
  });

  it("should work with extended account types", () => {
    interface ExtendedAccount extends BaseRawDetailedAccount {
      customField: string;
    }

    const extendedAccounts: ExtendedAccount[] = [
      { ...mockAccounts[0], customField: "test1" },
      { ...mockAccounts[2], customField: "test2" },
    ];

    const sortedAccounts = sortAccountsByFiatValue(extendedAccounts);
    expect(sortedAccounts[0].customField).toBe("test2"); // Higher fiat value
    expect(sortedAccounts[1].customField).toBe("test1"); // Lower fiat value
  });
});
