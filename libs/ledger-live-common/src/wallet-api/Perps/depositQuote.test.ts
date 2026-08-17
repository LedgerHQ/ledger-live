import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { fetchPerpsDepositQuote, PERPS_DEPOSIT_QUOTE_PROVIDER } from "./depositQuote";
import { fetchQuotes } from "../Exchange/quotes/service/fetchQuotes";
import type { FetchQuotesResult } from "../Exchange/quotes/service/types";

jest.mock("../Exchange/quotes/service/fetchQuotes");

const mockedFetchQuotes = jest.mocked(fetchQuotes);

const parentAccount = {
  type: "Account",
  id: "js:2:arbitrum:0xsender:",
  currency: { id: "arbitrum" },
  freshAddress: "0xsender",
} as unknown as Account;

const depositAccount = {
  type: "TokenAccount",
  id: "js:2:arbitrum:0xsender:+usd_coin",
  parentId: parentAccount.id,
  token: { id: "arbitrum/erc20/usd_coin" },
} as unknown as TokenAccount;

const receiverAccount = {
  type: "Account",
  id: "js:2:hypercore:0xreceiver:",
  currency: { id: "hypercore" },
  freshAddress: "0xreceiver",
} as unknown as Account;

const accounts: AccountLike[] = [
  { ...parentAccount, subAccounts: [depositAccount] },
  depositAccount,
  receiverAccount,
];

const params = {
  accounts,
  depositAccount,
  receiverAccount,
  amount: "10",
  counterValueCurrency: "USD",
};

const rawQuote = {
  amountTo: 9.87,
  quoteId: "quote-1",
} as unknown as FetchQuotesResult["rawQuotes"][number];

describe("fetchPerpsDepositQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the amount the perps account receives, and the quote that priced it", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [rawQuote], providerErrors: [] });

    const quote = await fetchPerpsDepositQuote(params);

    expect(quote?.amountTo.toString()).toBe("9.87");
    expect(quote?.quoteId).toBe("quote-1");
  });

  it("quotes the funding pair through the perps provider only", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [rawQuote], providerErrors: [] });

    await fetchPerpsDepositQuote(params);

    expect(mockedFetchQuotes).toHaveBeenCalledWith(
      {
        providers: [PERPS_DEPOSIT_QUOTE_PROVIDER],
        data: expect.objectContaining({
          amount: "10",
          sendAddress: "0xsender",
          receiveAddress: "0xreceiver",
          sendCurrencyId: "arbitrum/erc20/usd_coin",
          receiveCurrencyId: "hypercore",
        }),
      },
      "USD",
    );
  });

  it("returns nothing when the provider quotes no price", async () => {
    mockedFetchQuotes.mockResolvedValue({ rawQuotes: [], providerErrors: [] });

    await expect(fetchPerpsDepositQuote(params)).resolves.toBeUndefined();
  });

  it("does not call the provider when the accounts cannot be resolved", async () => {
    await expect(fetchPerpsDepositQuote({ ...params, accounts: [] })).resolves.toBeUndefined();
    expect(mockedFetchQuotes).not.toHaveBeenCalled();
  });
});
