/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { hubStateSelector } from "../reducer";
import { useCheckAccountWithFundsAction } from "./useCheckAccountWithFundsAction";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { createFixtureCryptoCurrency } from "../../mock/fixtures/cryptoCurrencies";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { BigNumber } from "bignumber.js";

jest.mock("../reducer");
jest.mock("react-redux", () => ({
  useSelector: val => val(),
}));

const mockedHubStateSelector = jest.mocked(hubStateSelector);

const defaultHubState = {
  deviceModelId: DeviceModelId.nanoX,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
  postOnboardingInProgress: false,
};

const stateFundsTransferCompleted = {
  deviceModelId: DeviceModelId.nanoX,
  actionsToComplete: [PostOnboardingActionId.assetsTransfer],
  actionsCompleted: {
    [PostOnboardingActionId.assetsTransfer]: true,
  },
  lastActionCompleted: PostOnboardingActionId.personalizeMock,
  postOnboardingInProgress: true,
};

const mockCompleteAction = jest.fn();

const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
const ethereumAccountZero = genAccount("ethereum-account-zero", {
  currency: ethereumCurrency,
});
ethereumAccountZero.balance = new BigNumber("0");
const nonFundedAccount = [ethereumAccountZero];

const ethereumAccountWithBalance = genAccount("ethereum-account-balance", {
  currency: ethereumCurrency,
});
ethereumAccountWithBalance.balance = new BigNumber("10000");
const fundedAccount = [ethereumAccountWithBalance];

describe("useCheckAccountWithFundsAction", () => {
  beforeEach(() => {
    mockCompleteAction.mockClear();
    mockedHubStateSelector.mockClear();
  });

  it("should not run completeAction when asset transfer not complete and account with no funds", () => {
    const state = defaultHubState;
    mockedHubStateSelector.mockReturnValue(state);

    const { result } = renderHook(() => useCheckAccountWithFundsAction(mockCompleteAction));

    act(() => {
      result.current(nonFundedAccount);
    });

    expect(mockCompleteAction).not.toHaveBeenCalled();
  });

  it("should run completeAction when asset transfer not complete and account with funds", () => {
    const state = defaultHubState;
    mockedHubStateSelector.mockReturnValue(state);

    const { result } = renderHook(() => useCheckAccountWithFundsAction(mockCompleteAction));

    act(() => {
      result.current(fundedAccount);
    });

    expect(mockCompleteAction).toHaveBeenCalled();
    expect(mockCompleteAction).toHaveBeenNthCalledWith(1, PostOnboardingActionId.assetsTransfer);
  });

  it("should not run completeAction when asset transfer complete and account with funds", () => {
    const state = stateFundsTransferCompleted;
    mockedHubStateSelector.mockReturnValue(state);

    const { result } = renderHook(() => useCheckAccountWithFundsAction(mockCompleteAction));

    act(() => {
      result.current(fundedAccount);
    });

    expect(mockCompleteAction).not.toHaveBeenCalled();
  });
});
