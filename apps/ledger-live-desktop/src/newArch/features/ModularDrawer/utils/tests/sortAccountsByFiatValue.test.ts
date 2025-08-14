import { sortAccountsByFiatValue } from "../sortAccountsByFiatValue";
import { type Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";

const mockAccounts = [
  {
    name: "Ethereum",
    id: "js:2:ethereum:0xaDf49b9f133fb137e82b24F06D23E49c51f586C7:",
    ticker: "ETH",
    balance: "1.55699 ETH",
    fiatValue: "$4,149.62",
    address: "0xaDf...586C7",
    cryptoId: "ethereum",
    protocol: "",
  },
  {
    name: "Ethereum",
    id: "js:2:ethereum:0xd4b6595ff5f3c21E0b00edB8947A31110a9c4B8f:",
    ticker: "ETH",
    balance: "0.178403 ETH",
    fiatValue: "$475.47",
    address: "0xd4b...c4B8f",
    cryptoId: "ethereum",
    protocol: "",
  },
  {
    name: "Ethereum",
    id: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7:",
    ticker: "ETH",
    balance: "5.10589 ETH",
    fiatValue: "$13,607.93",
    address: "0x833...e33c7",
    cryptoId: "ethereum",
    protocol: "",
  },
  {
    name: "Ethereum",
    id: "js:2:ethereum:0xDbD543b0e80e0E73FbD49FDEe902FC59652753B9:",
    ticker: "ETH",
    balance: "0.00148572 ETH",
    fiatValue: "$3.96",
    address: "0xDbD...753B9",
    cryptoId: "ethereum",
    protocol: "",
  },
] satisfies DetailedAccount[];

const expectedSortedAccounts = [
  mockAccounts[2], // $13,607.93
  mockAccounts[0], // $4,149.62
  mockAccounts[1], // $475.47
  mockAccounts[3], // $3.96
] satisfies DetailedAccount[];

describe("sortAccountsByBalance", () => {
  it("should sort accounts by fiat value in descending order", () => {
    const sortedAccounts = sortAccountsByFiatValue(mockAccounts);
    expect(sortedAccounts).toEqual(expectedSortedAccounts);
  });

  it("should handle empty accounts array", () => {
    const sortedAccounts = sortAccountsByFiatValue([]);
    expect(sortedAccounts).toEqual([]);
  });

  it("should handle accounts with identical balances", () => {
    const identicalAccounts = [
      { ...mockAccounts[0], fiatValue: "1$" },
      { ...mockAccounts[1], fiatValue: "1$" },
    ];
    const sortedAccounts = sortAccountsByFiatValue(identicalAccounts);
    expect(sortedAccounts).toEqual(identicalAccounts);
  });

  it("should handle accounts with zero $", () => {
    const zeroBalanceAccounts = [
      { ...mockAccounts[0], fiatValue: "$0" },
      { ...mockAccounts[1], balance: "$10000" },
    ];
    const sortedAccounts = sortAccountsByFiatValue(zeroBalanceAccounts);
    expect(sortedAccounts).toEqual([zeroBalanceAccounts[1], zeroBalanceAccounts[0]]);
  });
});
