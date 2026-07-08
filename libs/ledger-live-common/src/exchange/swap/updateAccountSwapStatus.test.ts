import BigNumber from "bignumber.js";
import type { Account, Operation, SwapOperation, TokenAccount } from "@ledgerhq/types-live";
import { getMultipleStatus } from "./getStatus";
import updateAccountSwapStatus from "./updateAccountSwapStatus";

jest.mock("./getStatus", () => ({
  getMultipleStatus: jest.fn(),
}));

const mockedGetMultipleStatus = jest.mocked(getMultipleStatus);

function makeOperation(): Operation {
  return {
    id: "operation-id-1",
    hash: "0xhash",
  } as unknown as Operation;
}

function makeSwapOperation(overrides: Partial<SwapOperation> = {}): SwapOperation {
  return {
    status: "pending",
    provider: "lifi",
    operationId: "operation-id",
    swapId: "swap-1",
    receiverAccountId: "to-account",
    fromAmount: new BigNumber("100000000"),
    toAmount: new BigNumber("2000000"),
    ...overrides,
  } as SwapOperation;
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    type: "Account",
    id: "from-account",
    currency: {
      type: "CryptoCurrency",
      id: "ethereum",
    },
    operations: [makeOperation()],
    pendingOperations: [],
    swapHistory: [makeSwapOperation()],
    subAccounts: [],
    ...overrides,
  } as unknown as Account;
}

function makeTokenAccount(overrides: Partial<TokenAccount> = {}): TokenAccount {
  return {
    type: "TokenAccount",
    id: "token-account",
    token: {
      type: "TokenCurrency",
      id: "ethereum/erc20/usdc",
      parentCurrencyId: "ethereum",
    },
    operations: [makeOperation()],
    pendingOperations: [],
    swapHistory: [makeSwapOperation()],
    ...overrides,
  } as unknown as TokenAccount;
}

describe("updateAccountSwapStatus", () => {
  beforeEach(() => {
    mockedGetMultipleStatus.mockReset();
  });

  it("backfills finalAmount from backend status response", async () => {
    mockedGetMultipleStatus.mockResolvedValueOnce([
      {
        provider: "lifi",
        swapId: "swap-1",
        status: "finished",
        finalAmount: "1.99",
      },
    ]);

    const result = await updateAccountSwapStatus(makeAccount());

    expect(mockedGetMultipleStatus).toHaveBeenCalledWith([
      {
        provider: "lifi",
        swapId: "swap-1",
        transactionId: "0xhash",
        operationId: "operation-id",
      },
    ]);
    expect(result?.swapHistory[0]).toMatchObject({
      status: "finished",
      finalAmount: new BigNumber("1.99"),
    });
  });

  it("re-polls a finished swap that has no finalAmount stored", async () => {
    mockedGetMultipleStatus.mockResolvedValueOnce([
      {
        provider: "lifi",
        swapId: "swap-1",
        status: "finished",
        finalAmount: "2.50",
      },
    ]);

    const result = await updateAccountSwapStatus(
      makeAccount({
        swapHistory: [makeSwapOperation({ status: "finished" })],
      }),
    );

    expect(mockedGetMultipleStatus).toHaveBeenCalled();
    expect(result?.swapHistory[0]).toMatchObject({
      status: "finished",
      finalAmount: new BigNumber("2.50"),
    });
  });
});
