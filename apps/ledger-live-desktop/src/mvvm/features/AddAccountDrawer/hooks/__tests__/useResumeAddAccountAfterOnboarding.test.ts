import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { AFTER_ONBOARDING_STATE, INITIAL_STATE } from "~/renderer/reducers/settings";
import { addAccountToResumeSelector, type AddAccountResume } from "~/renderer/reducers/onboarding";
import { useResumeAddAccountAfterOnboarding } from "../useResumeAddAccountAfterOnboarding";

const mockOpenAddAccountFlow = jest.fn();
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({
    openAssetFlow: jest.fn(),
    openAddAccountFlow: mockOpenAddAccountFlow,
  }),
}));

const awaiting = (resume: Partial<AddAccountResume> = {}) => ({
  addAccountResume: { returnTo: "/", currency: usdcToken, awaitingOnboarding: true, ...resume },
});

describe("useResumeAddAccountAfterOnboarding", () => {
  beforeEach(() => {
    mockOpenAddAccountFlow.mockClear();
  });

  it("reopens Add Account on its asset once a device is onboarded, and only once", () => {
    const { store } = renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialState: { settings: AFTER_ONBOARDING_STATE, onboarding: awaiting() },
    });

    expect(mockOpenAddAccountFlow).toHaveBeenCalledWith(usdcToken);
    expect(addAccountToResumeSelector(store.getState())).toBeNull();
  });

  it("resumes on any screen the flow started from, not only the portfolio", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialRoute: "/accounts",
      initialState: {
        settings: AFTER_ONBOARDING_STATE,
        onboarding: awaiting({ returnTo: "/accounts", currency: bitcoin }),
      },
    });

    expect(mockOpenAddAccountFlow).toHaveBeenCalledWith(bitcoin);
  });

  it("waits while the user is not on the screen the flow started from", () => {
    const { store } = renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialRoute: "/accounts",
      initialState: { settings: AFTER_ONBOARDING_STATE, onboarding: awaiting() },
    });

    expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
    expect(addAccountToResumeSelector(store.getState())).not.toBeNull();
  });

  it("waits while no device is onboarded", () => {
    const { store } = renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialState: { settings: INITIAL_STATE, onboarding: awaiting() },
    });

    expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
    expect(addAccountToResumeSelector(store.getState())).not.toBeNull();
  });

  it("does nothing for an Add Account flow that was not sent to onboarding", () => {
    renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialState: {
        settings: AFTER_ONBOARDING_STATE,
        onboarding: awaiting({ awaitingOnboarding: false }),
      },
    });

    expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
  });
});
