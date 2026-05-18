/**
 * @jest-environment jsdom
 */
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useNavigateToPostOnboardingHubCallback } from "../useNavigateToPostOnboardingHubCallback";

const mockNavigate = jest.fn();
const mockOpenFinishOnboardingDialog = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock(
  "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog",
  () => ({
    __esModule: true,
    default: () => ({
      handleOpen: mockOpenFinishOnboardingDialog,
    }),
  }),
);

describe("useNavigateToPostOnboardingHubCallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to portfolio and open finish dialog when Wallet40 finish widget is enabled", () => {
    const { result } = renderHook(() => useNavigateToPostOnboardingHubCallback(), {
      initialState: {
        ...withFlagOverrides({
          lwdWallet40: {
            enabled: true,
            params: { finishOnboardingWidget: true },
          },
        }),
        settings: { hasBeenRedirectedToPostOnboarding: false },
      },
    });

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    expect(mockOpenFinishOnboardingDialog).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalledWith("/post-onboarding");
  });

  it("should not reopen finish dialog when already redirected with Wallet40 enabled", () => {
    const { result } = renderHook(() => useNavigateToPostOnboardingHubCallback(), {
      initialState: {
        ...withFlagOverrides({
          lwdWallet40: {
            enabled: true,
            params: { finishOnboardingWidget: true },
          },
        }),
        settings: { hasBeenRedirectedToPostOnboarding: true },
      },
    });

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    expect(mockOpenFinishOnboardingDialog).not.toHaveBeenCalled();
  });

  it("should navigate to post-onboarding hub when finish widget is disabled", () => {
    const { result } = renderHook(() => useNavigateToPostOnboardingHubCallback());

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/post-onboarding");
    expect(mockOpenFinishOnboardingDialog).not.toHaveBeenCalled();
  });
});
