import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import { saveSwapToHistory, type SwapProps } from "../saveSwapToHistory";

const fromAccount = genAccount("swap-from", { operationsSize: 0, swapHistorySize: 0 });
const toAccount = genAccount("swap-to", { operationsSize: 0, swapHistorySize: 0 });
setWalletApiIdForAccountId(fromAccount.id);
setWalletApiIdForAccountId(toAccount.id);

const swap: SwapProps = {
  provider: "lifi",
  fromAccountId: getWalletApiIdFromAccountId(fromAccount.id),
  toAccountId: getWalletApiIdFromAccountId(toAccount.id),
  fromAmount: "1",
  toAmount: "2",
  quoteId: "",
  rate: "2",
  feeStrategy: "medium",
  customFeeConfig: "",
  cacheKey: "",
  loading: false,
  error: false,
  providerRedirectURL: "",
  toNewTokenId: "",
  swapApiBase: "",
  estimatedFees: "0",
  estimatedFeesUnit: "",
  swapId: "swap-123",
};

describe("saveSwapToHistory", () => {
  const dispatch = jest.fn();
  let warn: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  function save(overrides: Partial<SwapProps>) {
    return saveSwapToHistory(
      [fromAccount, toAccount],
      dispatch,
    )({ params: { swap: { ...swap, ...overrides }, transaction_id: "0xhash" } });
  }

  function savedSwapOperation() {
    const [[action]] = dispatch.mock.calls;
    return action.payload.updater(fromAccount).swapHistory.at(-1);
  }

  it("saves the swap amounts in the accounts' smallest units", async () => {
    await expect(save({})).resolves.toBe("Swap saved to history");
    expect(savedSwapOperation()).toMatchObject({
      fromAmount: new BigNumber(1).shiftedBy(fromAccount.currency.units[0].magnitude),
      toAmount: new BigNumber(2).shiftedBy(toAccount.currency.units[0].magnitude),
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("still saves the swap with 0 amounts when the amounts are unreadable", async () => {
    await expect(save({ fromAmount: "abc", toAmount: "1_000" })).resolves.toBe(
      "Swap saved to history",
    );
    expect(savedSwapOperation()).toMatchObject({
      fromAmount: new BigNumber(0),
      toAmount: new BigNumber(0),
    });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([{ fromAmount: "" }, { toAmount: "" }, { toAmount: undefined }])(
    "keeps rejecting missing amounts %p as missing params",
    async overrides => {
      await expect(save(overrides)).rejects.toBe("Cannot save swap missing params");
      expect(dispatch).not.toHaveBeenCalled();
    },
  );
});
