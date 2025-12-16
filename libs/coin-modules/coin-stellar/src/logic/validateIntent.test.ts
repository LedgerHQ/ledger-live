import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import * as network from "../network";
import * as horizon from "../network/horizon";
import { NetworkInfo, StellarMemo, StellarMemoKind, StellarWrongMemoFormat } from "../types";
import * as utils from "./utils";
import { validateIntent } from "./validateIntent";
import * as logicValidateMemo from "./validateMemo";

jest.mock("../network/horizon");

describe("validateIntent", () => {
  const spiedValidateMemo = jest.spyOn(logicValidateMemo, "validateMemo");
  const spiedFetchAccount = jest.spyOn(horizon, "fetchAccount");
  const spiedFetchAccountNetworkInfo = jest.spyOn(network, "fetchAccountNetworkInfo");
  const spiedIsAccountMultiSign = jest.spyOn(utils, "isAccountMultiSign");

  beforeEach(() => {
    spiedValidateMemo.mockClear();
    spiedFetchAccount.mockClear();
    spiedFetchAccountNetworkInfo.mockClear();
    spiedIsAccountMultiSign.mockClear();

    spiedFetchAccount.mockResolvedValue({
      spendableBalance: BigNumber(0),
      balance: BigNumber(0),
      blockHeight: 0,
      assets: [],
    });
    spiedFetchAccountNetworkInfo.mockResolvedValue({
      baseFee: BigNumber(0),
      fees: BigNumber(0),
    } as NetworkInfo);
    spiedIsAccountMultiSign.mockResolvedValue(false);
  });

  it.each(["MEMO_TEXT", "MEMO_ID", "MEMO_HASH", "MEMO_RETURN"])(
    "should not set error on transaction when memo is validated for type %s",
    async (type: string) => {
      spiedValidateMemo.mockReturnValue(true);

      const intent = {
        asset: { type: "native" },
        memo: { type, value: "random memo for unit test" },
      } as TransactionIntent<{ type: Exclude<StellarMemoKind, "NO_MEMO">; value: string }>;
      const fees = {} as FeeEstimation;
      const status = await validateIntent(intent, fees);
      expect(status.errors.transaction).not.toBeDefined();

      expect(spiedValidateMemo).toHaveBeenCalledWith(intent.memo.value, intent.memo.type);
    },
  );

  it.each(["MEMO_TEXT", "MEMO_ID", "MEMO_HASH", "MEMO_RETURN"])(
    "should set error on transaction when memo is invalidated for type %s",
    async (type: string) => {
      spiedValidateMemo.mockReturnValue(false);

      const intent = {
        asset: { type: "native" },
        memo: { type, value: "random memo for unit test" },
      } as TransactionIntent<{ type: Exclude<StellarMemoKind, "NO_MEMO">; value: string }>;
      const fees = {} as FeeEstimation;
      const status = await validateIntent(intent, fees);
      expect(status.errors.transaction).toBeInstanceOf(StellarWrongMemoFormat);

      expect(spiedValidateMemo).toHaveBeenCalledWith(intent.memo.value, intent.memo.type);
    },
  );

  it("should not validate memo when type is NO_MEMO", async () => {
    spiedValidateMemo.mockReturnValue(true);

    const intent = {
      asset: { type: "native" },
      memo: { type: "NO_MEMO" },
    } as TransactionIntent<StellarMemo>;
    const fees = {} as FeeEstimation;
    const status = await validateIntent(intent, fees);
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).not.toHaveBeenCalled();
  });
});
