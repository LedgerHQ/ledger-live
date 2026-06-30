import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { saveSwapToHistory } from "./saveSwapToHistory";

function makeAccount(id: string, magnitude: number): Account {
  return {
    type: "Account",
    id,
    currency: {
      type: "CryptoCurrency",
      id: `${id}-currency`,
      units: [{ code: "TEST", magnitude, name: "TEST" }],
    },
    swapHistory: [],
  } as unknown as Account;
}

describe("saveSwapToHistory", () => {
  it("persists the terminal status and final filled amount when provided", async () => {
    const fromAccount = makeAccount("from-account", 8);
    const toAccount = makeAccount("to-account", 6);
    setWalletApiIdForAccountId(fromAccount.id);
    setWalletApiIdForAccountId(toAccount.id);
    const dispatch = jest.fn();

    await expect(
      saveSwapToHistory(
        [fromAccount, toAccount],
        dispatch,
      )({
        params: {
          transaction_id: "0xhash",
          swap: {
            provider: "oneinch",
            fromAccountId: getWalletApiIdFromAccountId(fromAccount.id),
            toAccountId: getWalletApiIdFromAccountId(toAccount.id),
            fromAmount: "1.2",
            toAmount: "2.5",
            quoteId: "quote-1",
            rate: "2",
            feeStrategy: "medium",
            customFeeConfig: "{}",
            cacheKey: "cache-1",
            loading: false,
            error: false,
            providerRedirectURL: "",
            toNewTokenId: "",
            swapApiBase: "https://swap.test",
            estimatedFees: "0",
            estimatedFeesUnit: "ETH",
            swapId: "swap-1",
            status: "finished",
            finalAmount: "2.49",
          },
        },
      }),
    ).resolves.toBe("Swap saved to history");

    const action = dispatch.mock.calls[0][0];
    const updatedAccount = action.payload.updater(fromAccount);
    const [swapOperation] = updatedAccount.swapHistory;

    expect(action.payload.accountId).toBe(fromAccount.id);
    expect(swapOperation).toMatchObject({
      status: "finished",
      provider: "oneinch",
      operationId: "from-account-0xhash-OUT",
      swapId: "swap-1",
      receiverAccountId: "to-account",
    });
    expect(swapOperation.fromAmount).toEqual(new BigNumber("120000000"));
    expect(swapOperation.toAmount).toEqual(new BigNumber("2500000"));
    expect(swapOperation.finalAmount).toEqual(new BigNumber("2.49"));
  });
});
