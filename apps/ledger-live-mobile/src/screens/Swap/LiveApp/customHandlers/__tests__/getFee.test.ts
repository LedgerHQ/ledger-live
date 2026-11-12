import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { ExchangeError } from "@ledgerhq/live-common/wallet-api/Exchange/error";
import { getFee, type FeeParams } from "../getFee";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const navigation = { navigate: jest.fn(), canGoBack: jest.fn(), goBack: jest.fn() };

const baseParams: FeeParams = {
  fromAccountId: "unknown-wallet-account",
  fromAmount: "1",
  feeStrategy: "medium",
  openDrawer: false,
  customFeeConfig: {},
  SWAP_VERSION: "2",
};

function callGetFee(params: Partial<FeeParams>) {
  return getFee([], navigation)({ params: { ...baseParams, ...params } });
}

describe("getFee", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([{ fromAmount: "abc" }, { gasLimit: "abc" }])(
    "rejects %p as wrong swap params before reaching the bridge",
    async params => {
      const result = callGetFee(params);

      await expect(result).rejects.toBeInstanceOf(ExchangeError);
      await expect(result).rejects.toMatchObject({ cause: "WRONG_SWAP_PARAMS" });
      expect(getAccountBridge).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, ""])(
    "estimates fees with no amount %p typed yet and goes on to the account lookup",
    async fromAmount => {
      await expect(callGetFee({ fromAmount })).rejects.toThrow(
        "accountId unknown-wallet-account unknown",
      );
    },
  );

  it.each([undefined, "", "0x10"])(
    "accepts gasLimit %p and goes on to the account lookup",
    async gasLimit => {
      await expect(callGetFee({ gasLimit })).rejects.toThrow(
        "accountId unknown-wallet-account unknown",
      );
    },
  );
});
