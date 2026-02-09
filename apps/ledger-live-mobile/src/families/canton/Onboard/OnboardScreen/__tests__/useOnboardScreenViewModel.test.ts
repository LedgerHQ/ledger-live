/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { renderHook } from "@tests/test-renderer";
import { INITIAL_STATE } from "~/reducers/settings";
import { State } from "~/reducers/types";
import { useOnboardScreenViewModel } from "../useOnboardScreenViewModel";
import { createMockAccount, createMockNavigation, createMockRouteParams } from "./test-utils";

const mockObservable = () => ({
  pipe: jest.fn(() => ({ subscribe: jest.fn() })),
  subscribe: jest.fn(),
});

const mockOnboardAccount = jest.fn(mockObservable);
const mockAuthorizePreapproval = jest.fn(mockObservable);

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() => ({
    onboardAccount: mockOnboardAccount,
    authorizePreapproval: mockAuthorizePreapproval,
  })),
}));

describe("useOnboardScreenViewModel", () => {
  const mockNavigation = createMockNavigation();

  const overrideInitialStateWithFeatureFlag = (state: State): State => ({
    ...state,
    settings: {
      ...INITIAL_STATE,
      ...state.settings,
      overriddenFeatureFlags: {
        cantonSkipPreapprovalStep: { enabled: false },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with INIT status", () => {
    const routeParams = createMockRouteParams();
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.onboardingStatus).toBe(OnboardStatus.INIT);
    expect(result.current.onboardResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it("should compute accountsToDisplay correctly for reonboarding", () => {
    const reonboardAccount = createMockAccount({ id: "reonboard-account" });
    const routeParams = createMockRouteParams({
      isReonboarding: true,
      accountToReonboard: reonboardAccount,
      accountsToAdd: [createMockAccount({ id: "other-account" })],
    });
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.accountsToDisplay).toEqual([reonboardAccount]);
    expect(result.current.isReonboarding).toBe(true);
  });

  it("should compute accountsToDisplay correctly for normal onboarding", () => {
    const account1 = createMockAccount({ id: "account-1" });
    const account2 = createMockAccount({ id: "account-2" });
    const routeParams = createMockRouteParams({
      accountsToAdd: [account1, account2],
    });
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.accountsToDisplay).toEqual([account1, account2]);
    expect(result.current.isReonboarding).toBe(false);
  });

  it("should compute isProcessing correctly", () => {
    const routeParams = createMockRouteParams();
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.isProcessing).toBe(false);
  });

  it("should compute confirmDisabled correctly", () => {
    const routeParams = createMockRouteParams();
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.confirmDisabled).toBe(true);
  });

  it("should compute confirmDisabled correctly for reonboarding", () => {
    const reonboardAccount = createMockAccount({ id: "reonboard-account" });
    const routeParams = createMockRouteParams({
      isReonboarding: true,
      accountToReonboard: reonboardAccount,
    });
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.confirmDisabled).toBe(false);
  });

  it("should provide retryOnboarding function", () => {
    const routeParams = createMockRouteParams();
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(typeof result.current.retryOnboarding).toBe("function");
  });

  it("should provide handleConfirm function", () => {
    const routeParams = createMockRouteParams();
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(typeof result.current.handleConfirm).toBe("function");
  });

  it("should provide device and cryptoCurrency", () => {
    const routeParams = createMockRouteParams();
    const mockRoute = { params: routeParams };

    const { result } = renderHook(
      () =>
        useOnboardScreenViewModel({
          navigation: mockNavigation as any,
          route: mockRoute as any,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.device).toBeDefined();
    expect(result.current.cryptoCurrency).toBeDefined();
  });
});
