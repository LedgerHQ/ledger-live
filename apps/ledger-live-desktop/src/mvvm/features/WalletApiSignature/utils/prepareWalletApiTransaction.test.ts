import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { prepareWalletApiTransaction } from "./prepareWalletApiTransaction";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);

const ethAccount = genAccount("wallet-api-tx-main", {
  currency: getCryptoCurrencyById("ethereum"),
});

const tokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  parentCurrencyId: ethAccount.currency.id,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
};

const tokenAccount = genTokenAccount(0, ethAccount, tokenCurrency);

describe("prepareWalletApiTransaction", () => {
  const createTransaction = jest.fn();
  const updateTransaction = jest.fn(
    (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...tx,
      ...patch,
    }),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    createTransaction.mockReturnValue({
      family: "evm",
      amount: new BigNumber(0),
      recipient: "",
    });
    mockedGetAccountBridge.mockResolvedValue({
      createTransaction,
      updateTransaction,
    } as never);
  });

  it("should build a main-account transaction with recipient before remaining liveTx fields", async () => {
    const liveTx = {
      recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
      amount: new BigNumber("1000"),
      feesStrategy: "custom",
    } as Partial<Transaction>;

    const result = await prepareWalletApiTransaction(ethAccount, undefined, liveTx);

    expect(mockedGetAccountBridge).toHaveBeenCalledWith(ethAccount, undefined);
    expect(createTransaction).toHaveBeenCalledWith(ethAccount);
    expect(updateTransaction).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ family: "evm" }),
      {
        recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
        subAccountId: undefined,
      },
    );
    expect(updateTransaction).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
        subAccountId: undefined,
      }),
      {
        amount: new BigNumber("1000"),
        feesStrategy: "custom",
      },
    );
    expect(result).toEqual(
      expect.objectContaining({
        family: "evm",
        recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
        subAccountId: undefined,
        amount: new BigNumber("1000"),
        feesStrategy: "custom",
      }),
    );
  });

  it("should set subAccountId when preparing a transaction for a TokenAccount", async () => {
    const liveTx = {
      recipient: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
      amount: new BigNumber("500"),
    } as Partial<Transaction>;

    const result = await prepareWalletApiTransaction(tokenAccount, ethAccount, liveTx);

    expect(mockedGetAccountBridge).toHaveBeenCalledWith(tokenAccount, ethAccount);
    expect(createTransaction).toHaveBeenCalledWith(tokenAccount);
    expect(updateTransaction).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ family: "evm" }),
      {
        recipient: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        subAccountId: tokenAccount.id,
      },
    );
    expect(result).toEqual(
      expect.objectContaining({
        recipient: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        subAccountId: tokenAccount.id,
        amount: new BigNumber("500"),
      }),
    );
  });
});
