import BigNumber from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { prepareLegacySaveSwapToHistory } from "./prepareLegacySaveSwapToHistory";
import * as converters from "../../wallet-api/converters";
import * as prepareSaveSwap from "./prepareSaveSwapToHistory";
import * as webApp from "./webApp";

jest.mock("../../wallet-api/converters");
jest.mock("./prepareSaveSwapToHistory");
jest.mock("./webApp");

describe("prepareLegacySaveSwapToHistory", () => {
  const mockAccount: AccountLike = {
    id: "account1",
    type: "Account",
  } as any;

  const mockAccount2: AccountLike = {
    id: "account2",
    type: "Account",
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call prepareSaveSwapToHistory with converted amounts", () => {
    (converters.getAccountIdFromWalletAccountId as jest.Mock)
      .mockReturnValueOnce("account1")
      .mockReturnValueOnce("account2");
    (webApp.convertToAtomicUnit as jest.Mock)
      .mockReturnValueOnce(new BigNumber(1000))
      .mockReturnValueOnce(new BigNumber(2000));
    (prepareSaveSwap.prepareSaveSwapToHistory as jest.Mock).mockReturnValue({
      success: true,
    });

    const result = prepareLegacySaveSwapToHistory({
      params: {
        swap: {
          fromAccountId: "wallet1",
          toAccountId: "wallet2",
          fromAmount: "100",
          toAmount: "200",
        } as any,
        transaction_id: "tx123",
      },
      accounts: [mockAccount, mockAccount2],
    });

    expect(prepareSaveSwap.prepareSaveSwapToHistory).toHaveBeenCalledWith(
      [mockAccount, mockAccount2],
      expect.objectContaining({
        fromAccountId: "account1",
        toAccountId: "account2",
        transactionId: "tx123",
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it("should throw error if fromId is missing", () => {
    (converters.getAccountIdFromWalletAccountId as jest.Mock)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce("account2");

    expect(() =>
      prepareLegacySaveSwapToHistory({
        params: {
          swap: { fromAccountId: "wallet1", toAccountId: "wallet2" } as any,
          transaction_id: "tx123",
        },
        accounts: [mockAccount, mockAccount2],
      }),
    ).toThrow("Accounts not found");
  });

  it("should throw error if account not found in list", () => {
    (converters.getAccountIdFromWalletAccountId as jest.Mock)
      .mockReturnValueOnce("account1")
      .mockReturnValueOnce("account2");

    expect(() =>
      prepareLegacySaveSwapToHistory({
        params: {
          swap: { fromAccountId: "wallet1", toAccountId: "wallet2" } as any,
          transaction_id: "tx123",
        },
        accounts: [mockAccount],
      }),
    ).toThrow("accountId account2 unknown");
  });
});
