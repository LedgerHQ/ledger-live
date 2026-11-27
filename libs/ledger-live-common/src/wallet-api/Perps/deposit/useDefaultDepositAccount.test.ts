/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import useEnv from "@features/platform-env";
import { useDefaultDepositAccount } from "./useDefaultDepositAccount";

jest.mock("@features/platform-env", () => jest.fn());
jest.mock("../../../modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => () => true,
}));
const mockUnpriced = new Set<string>();
jest.mock("@features/platform-market-countervalues", () => ({
  useCalculateCountervalueCallback:
    () =>
    ({ id }: { id: string }, value: BigNumber) =>
      mockUnpriced.has(id) ? null : value,
}));

const mockUseEnv = jest.mocked(useEnv);

const account = (id: string, currencyId: string, balance: string): AccountLike =>
  ({
    type: "Account",
    id,
    currency: getCryptoCurrencyById(currencyId),
    spendableBalance: new BigNumber(balance),
  }) as unknown as AccountLike;

const receiverAccount = account("receiver", "ethereum", "0");
const sepolia = account("sepolia-1", "ethereum_sepolia", "1000000000000000000");
const counterValueCurrency = getCryptoCurrencyById("ethereum");

function renderDefault(accounts: AccountLike[]) {
  return renderHook(() =>
    useDefaultDepositAccount({ accounts, receiverAccount, counterValueCurrency }),
  ).result.current;
}

describe("useDefaultDepositAccount", () => {
  it("skips test networks the picker hides outside developer mode", () => {
    mockUseEnv.mockReturnValue(false);
    expect(renderDefault([sepolia])).toBeUndefined();
  });

  it("offers test networks in developer mode", () => {
    mockUseEnv.mockReturnValue(true);
    expect(renderDefault([sepolia])).toBe(sepolia);
  });

  it("skips tokens on a test network outside developer mode", () => {
    mockUseEnv.mockReturnValue(false);
    const sepoliaToken = {
      type: "TokenAccount",
      id: "sepolia-usdc",
      token: {
        type: "TokenCurrency",
        id: "ethereum_sepolia/erc20/usdc",
        ticker: "USDC",
        parentCurrencyId: "ethereum_sepolia",
        units: [{ magnitude: 6 }],
      },
      spendableBalance: new BigNumber(1_000_000),
    } as unknown as AccountLike;

    expect(renderDefault([sepoliaToken])).toBeUndefined();
  });

  it("ranks by fiat balance and treats an unpriced account as zero", () => {
    mockUseEnv.mockReturnValue(false);
    mockUnpriced.add("bitcoin");
    const btc = account("btc-1", "bitcoin", "100000000");
    const eth = account("eth-1", "ethereum", "1000");

    expect(renderDefault([btc, eth])).toBe(eth);
    mockUnpriced.clear();
  });

  it("never picks the receiving account", () => {
    mockUseEnv.mockReturnValue(false);
    const fundedReceiver = { ...receiverAccount, spendableBalance: new BigNumber(1) };
    expect(renderDefault([fundedReceiver])).toBeUndefined();
  });
});
