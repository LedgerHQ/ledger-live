import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { deriveRequestReceiveData } from "../deriveRequestReceiveData";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: jest.fn(),
  getMainAccount: jest.fn(),
}));

const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedGetMainAccount = jest.mocked(getMainAccount);

describe("deriveRequestReceiveData", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should keep the token identity while sourcing the address/network from the parent account", () => {
    const account = { type: "TokenAccount" } as unknown as AccountLike;
    const parentAccount = { type: "Account" } as unknown as Account;

    mockedGetAccountCurrency.mockReturnValue({
      id: "base/erc20/usd__coin",
      name: "USD Coin",
      ticker: "USDC",
    } as ReturnType<typeof getAccountCurrency>);
    mockedGetMainAccount.mockReturnValue({
      freshAddress: "0xTokenParentAddress",
      currency: { id: "base", name: "Base", ticker: "ETH" },
    } as ReturnType<typeof getMainAccount>);

    const data = deriveRequestReceiveData(account, parentAccount);

    expect(mockedGetAccountCurrency).toHaveBeenCalledWith(account);
    expect(mockedGetMainAccount).toHaveBeenCalledWith(account, parentAccount);
    expect(data).toEqual({
      address: "0xTokenParentAddress",
      asset: { name: "USD Coin", ticker: "USDC" },
      network: "Base",
      assetIcon: { ledgerId: "base/erc20/usd__coin", ticker: "USDC", network: "base" },
      networkIcon: { ledgerId: "base", ticker: "ETH" },
    });
  });

  it("should map a native account to matching asset and network primitives", () => {
    const account = { type: "Account" } as unknown as AccountLike;

    mockedGetAccountCurrency.mockReturnValue({
      id: "ethereum",
      name: "Ethereum",
      ticker: "ETH",
    } as ReturnType<typeof getAccountCurrency>);
    mockedGetMainAccount.mockReturnValue({
      freshAddress: "0xNativeAddress",
      currency: { id: "ethereum", name: "Ethereum", ticker: "ETH" },
    } as ReturnType<typeof getMainAccount>);

    const data = deriveRequestReceiveData(account);

    expect(data).toEqual({
      address: "0xNativeAddress",
      asset: { name: "Ethereum", ticker: "ETH" },
      network: "Ethereum",
      assetIcon: { ledgerId: "ethereum", ticker: "ETH", network: "ethereum" },
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });
});
