import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { renderHook, waitFor } from "@tests/test-renderer";
import { useCardTopUpMaxAmount } from "../useCardTopUpMaxAmount";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const account = {
  ...genAccount("card-top-up-max", { currency: getCryptoCurrencyById("bitcoin") }),
  spendableBalance: new BigNumber(100_000),
};

const estimateMaxSpendable = jest.fn();

beforeEach(() => {
  estimateMaxSpendable.mockReset();
  jest.mocked(getAccountBridge).mockResolvedValue({ estimateMaxSpendable } as never);
});

it("returns the bridge's maximum once it is known", async () => {
  estimateMaxSpendable.mockResolvedValue(new BigNumber(90_000));

  const { result } = renderHook(() => useCardTopUpMaxAmount(account));

  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toEqual(new BigNumber(90_000)));
  expect(estimateMaxSpendable).toHaveBeenCalledWith({ account, parentAccount: undefined });
});

it("never goes above the spendable balance", async () => {
  estimateMaxSpendable.mockResolvedValue(new BigNumber(200_000));

  const { result } = renderHook(() => useCardTopUpMaxAmount(account));

  await waitFor(() => expect(result.current).toEqual(new BigNumber(100_000)));
});

it("stays unknown when the estimate fails", async () => {
  estimateMaxSpendable.mockRejectedValue(new Error("no fees"));

  const { result } = renderHook(() => useCardTopUpMaxAmount(account));

  await waitFor(() => expect(estimateMaxSpendable).toHaveBeenCalled());
  expect(result.current).toBeNull();
});
