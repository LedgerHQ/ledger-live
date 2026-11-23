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
jest.mock("@features/platform-market-countervalues", () => ({
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
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

  it("never picks the receiving account", () => {
    mockUseEnv.mockReturnValue(false);
    const fundedReceiver = { ...receiverAccount, spendableBalance: new BigNumber(1) };
    expect(renderDefault([fundedReceiver])).toBeUndefined();
  });
});
