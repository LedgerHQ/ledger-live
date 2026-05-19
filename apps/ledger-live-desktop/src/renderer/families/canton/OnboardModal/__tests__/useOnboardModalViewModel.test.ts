/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { act, renderHook } from "tests/testSetup";
import { isStatusProcessing, useOnboardModalViewModel } from "../hooks/useOnboardModalViewModel";
import { StepId } from "../types";
import {
  createMockAccount,
  createMockCantonCurrency,
  createMockDevice,
  createMockImportableAccount,
} from "./testUtils";

const mockObservable = () => ({
  pipe: jest.fn(() => ({ subscribe: jest.fn() })),
  subscribe: jest.fn(),
});

const mockOnboardAccount = jest.fn(mockObservable);

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() => {
    const bridge = { onboardAccount: mockOnboardAccount };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  }),
}));
jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(params => ({
    type: "ADD_ACCOUNTS",
    payload: params,
  })),
}));

describe("useOnboardModalViewModel", () => {
  const mockCurrency = createMockCantonCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount({ used: false });
  const mockImportableAccount = createMockImportableAccount();

  const defaultParams = {
    currency: mockCurrency,
    editedNames: {} as { [key: string]: string },
    selectedAccounts: [mockAccount, mockImportableAccount],
    isReonboarding: false,
  };

  const initialState = {
    devices: { currentDevice: mockDevice, devices: [mockDevice] },
    accounts: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    expect(result.current.stepId).toBe(StepId.ONBOARD);
    expect(result.current.onboardingStatus).toBe(OnboardStatus.INIT);
    expect(result.current.onboardingResult).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.isReonboarding).toBe(false);
  });

  it("should compute creatableAccount from selectedAccounts", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    expect(result.current.creatableAccount).toEqual(mockAccount);
  });

  it("should compute importableAccounts from selectedAccounts", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    expect(result.current.importableAccounts).toEqual([mockImportableAccount]);
  });

  it("should use accountToReonboard as creatableAccount when reonboarding", () => {
    const accountToReonboard = createMockAccount({ id: "reonboard", used: true });
    const { result } = renderHook(
      () =>
        useOnboardModalViewModel({
          ...defaultParams,
          isReonboarding: true,
          accountToReonboard,
          selectedAccounts: [accountToReonboard],
        }),
      { initialState },
    );

    expect(result.current.creatableAccount).toEqual(accountToReonboard);
    expect(result.current.isReonboarding).toBe(true);
  });

  it("should provide action handlers", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    expect(typeof result.current.onOnboardAccount).toBe("function");
    expect(typeof result.current.onRetryOnboardAccount).toBe("function");
    expect(typeof result.current.onAddAccounts).toBe("function");
    expect(typeof result.current.transitionTo).toBe("function");
  });

  it("should read device from redux store", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    expect(result.current.device).toEqual(mockDevice);
  });

  it("should change stepId when transitionTo is called", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    expect(result.current.stepId).toBe(StepId.ONBOARD);

    act(() => {
      result.current.transitionTo(StepId.FINISH);
    });

    expect(result.current.stepId).toBe(StepId.FINISH);
  });

  it("should call bridge.onboardAccount when onOnboardAccount is called", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    act(() => {
      result.current.onOnboardAccount();
    });

    expect(mockOnboardAccount).toHaveBeenCalledWith(mockCurrency, mockDevice.deviceId, mockAccount);
  });

  it("should reset onboarding state when onRetryOnboardAccount is called", () => {
    const { result } = renderHook(() => useOnboardModalViewModel(defaultParams), {
      initialState,
    });

    act(() => {
      result.current.onRetryOnboardAccount();
    });

    expect(result.current.onboardingStatus).toBe(OnboardStatus.INIT);
    expect(result.current.error).toBeNull();
  });
});

describe("isStatusProcessing", () => {
  it("should return true for processing statuses", () => {
    expect(isStatusProcessing(OnboardStatus.PREPARE)).toBe(true);
    expect(isStatusProcessing(OnboardStatus.SIGN)).toBe(true);
    expect(isStatusProcessing(OnboardStatus.SUBMIT)).toBe(true);
  });

  it("should return false for non-processing statuses", () => {
    expect(isStatusProcessing(OnboardStatus.INIT)).toBe(false);
    expect(isStatusProcessing(OnboardStatus.SUCCESS)).toBe(false);
    expect(isStatusProcessing(OnboardStatus.ERROR)).toBe(false);
  });
});
