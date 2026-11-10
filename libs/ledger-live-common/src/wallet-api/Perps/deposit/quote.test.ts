import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import {
  QuoteErrorCodes,
  QuotesErrorCodes,
  type GetQuotesResponse,
  type Quote,
} from "@ledgerhq/wallet-api-exchange-module";
import { fetchPerpsDepositQuote } from "./quote";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import { getAccountIdFromWalletAccountId, getWalletApiIdFromAccountId } from "../../converters";
import { getQuotes } from "../../Exchange/quotes/getQuotes";

jest.mock("../../Exchange/quotes/getQuotes");

const mockedGetQuotes = jest.mocked(getQuotes);

const parentAccount = {
  type: "Account",
  id: "js:2:arbitrum:0xperpsdepositquote:",
  currency: { id: "arbitrum" },
} as unknown as Account;

const depositAccount = {
  type: "TokenAccount",
  id: "js:2:arbitrum:0xperpsdepositquote:+usd_coin",
  parentId: parentAccount.id,
  token: { id: "arbitrum/erc20/usd_coin" },
} as unknown as TokenAccount;

const receiverAccount = {
  type: "Account",
  id: "js:2:hypercore:0xperpsdepositreceiver:",
  currency: { id: "hypercore" },
} as unknown as Account;

const accounts: AccountLike[] = [parentAccount, depositAccount, receiverAccount];

const params = {
  accounts,
  depositAccount,
  receiverAccount,
  amount: "10",
  counterValueCurrency: "USD",
  locale: "en-US",
};

const quote = {
  id: "quote-1",
  quoteDetails: {
    receiveAmount: 9.87,
    estimatedNetworkFee: { amount: "1200", currencyId: "arbitrum" },
    approvalNetworkFee: { amount: "300", currencyId: "arbitrum" },
  },
  errors: [{ code: QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES }],
} as unknown as Quote;

function respondWith(response: Partial<GetQuotesResponse>) {
  mockedGetQuotes.mockResolvedValue({
    quotes: [],
    providerErrors: [],
    warnings: [],
    errors: [],
    ...response,
  });
}

describe("fetchPerpsDepositQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers the deposit, parent and receiver accounts before it asks for quotes", async () => {
    const registeredDuringCall: Array<string | undefined> = [];
    mockedGetQuotes.mockImplementation(async () => {
      registeredDuringCall.push(
        ...[depositAccount, parentAccount, receiverAccount].map(account =>
          getAccountIdFromWalletAccountId(getWalletApiIdFromAccountId(account.id)),
        ),
      );
      return { quotes: [], providerErrors: [], warnings: [], errors: [] };
    });

    await fetchPerpsDepositQuote(params);

    expect(registeredDuringCall).toEqual([depositAccount.id, parentAccount.id, receiverAccount.id]);
  });

  it("asks the perps provider only, with the wallet context", async () => {
    respondWith({});

    await fetchPerpsDepositQuote(params);

    expect(mockedGetQuotes).toHaveBeenCalledWith(
      {
        providers: [PERPS_SWAPKIT_PROVIDER],
        data: {
          amount: "10",
          sendAccountId: getWalletApiIdFromAccountId(depositAccount.id),
          receiveAccountId: getWalletApiIdFromAccountId(receiverAccount.id),
        },
      },
      {
        accounts,
        spotPrices: {},
        locale: "en-US",
        counterValueCurrency: "USD",
        onFeeEstimationFailed: expect.any(Function),
      },
    );
  });

  it("maps the first quote and keeps its fee fields and errors", async () => {
    respondWith({ quotes: [quote, { ...quote, id: "quote-2" }] });

    const result = await fetchPerpsDepositQuote(params);

    expect(result.quote?.amountTo.toString()).toBe("9.87");
    expect(result.quote).toMatchObject({
      quoteId: "quote-1",
      estimatedNetworkFee: { amount: "1200", currencyId: "arbitrum" },
      approvalNetworkFee: { amount: "300", currencyId: "arbitrum" },
      errors: [{ code: QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES }],
    });
  });

  it("returns the global errors when no quote comes back", async () => {
    const errors = [
      { code: QuotesErrorCodes.NO_QUOTES },
      { code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "12.5" },
    ] as GetQuotesResponse["errors"];
    respondWith({ errors });

    await expect(fetchPerpsDepositQuote(params)).resolves.toEqual({
      errors,
      feeEstimationFailed: false,
    });
  });

  it("reports a fee estimation failure of the quote engine", async () => {
    mockedGetQuotes.mockImplementation(async (_args, context) => {
      context.onFeeEstimationFailed?.(new Error("timeout"));
      return { quotes: [quote], providerErrors: [], warnings: [], errors: [] };
    });

    const result = await fetchPerpsDepositQuote(params);

    expect(result.feeEstimationFailed).toBe(true);
    expect(result.quote?.quoteId).toBe("quote-1");
  });

  it.each(["NotEnoughBalance", "NotEnoughGas", "NotEnoughBalanceInParentAccount"])(
    "does not report a %s error as a fee estimation failure",
    async name => {
      const balanceError = Object.assign(new Error("balance"), { name });
      mockedGetQuotes.mockImplementation(async (_args, context) => {
        context.onFeeEstimationFailed?.(balanceError);
        return { quotes: [quote], providerErrors: [], warnings: [], errors: [] };
      });

      const result = await fetchPerpsDepositQuote(params);

      expect(result.feeEstimationFailed).toBe(false);
    },
  );
});
