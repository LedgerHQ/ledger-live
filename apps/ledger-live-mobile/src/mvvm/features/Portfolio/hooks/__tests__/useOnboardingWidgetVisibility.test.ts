import { renderHook } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useOnboardingWidgetVisibility } from "../useOnboardingWidgetVisibility";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
const mockedEntryPointVisible = jest.mocked(usePostOnboardingEntryPointVisibleOnWallet);

const makeAccount = (balance: number): Account =>
  // @ts-expect-error partial Account for test purposes
  ({ type: "Account", balance: new BigNumber(balance), subAccounts: [] });

interface StateWithParams {
  deviceModelId?: DeviceModelId | null;
  eligibility?: boolean | null;
  accounts?: Account[];
  featureFlagOff?: boolean;
}

function stateWith({
  deviceModelId = DeviceModelId.nanoX,
  eligibility = true,
  accounts = [],
  featureFlagOff = false,
}: StateWithParams = {}) {
  return {
    overrideInitialState: (state: State) => ({
      ...state,
      accounts: { active: accounts },
      postOnboarding: {
        ...state.postOnboarding,
        deviceModelId,
        walletEntryPointEligibleForPortfolio: eligibility,
      },
      settings: {
        ...state.settings,
        overriddenFeatureFlags: {
          lwmWallet40: featureFlagOff
            ? { enabled: false }
            : { enabled: true, params: { onboardingWidget: true } },
        },
      },
    }),
  };
}

describe("useOnboardingWidgetVisibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEntryPointVisible.mockReturnValue(true);
  });

  it.each([
    { desc: "all conditions met", expected: true },
    { desc: "feature flag off", featureFlagOff: true, expected: false },
    { desc: "Nano S excluded", deviceModelId: DeviceModelId.nanoS, expected: false },
    { desc: "not eligible", eligibility: false, expected: false },
    { desc: "eligibility null + no funds", eligibility: null, expected: true },
    {
      desc: "eligibility null + has funds",
      eligibility: null,
      accounts: [makeAccount(1000)],
      expected: false,
    },
  ])("should return $expected when $desc", ({ expected, desc: _, ...overrides }) => {
    const { result } = renderHook(
      () => useOnboardingWidgetVisibility(),
      stateWith(overrides),
    );
    expect(result.current).toBe(expected);
  });

  it("should return false when entry point not visible", () => {
    mockedEntryPointVisible.mockReturnValue(false);
    const { result } = renderHook(() => useOnboardingWidgetVisibility(), stateWith());
    expect(result.current).toBe(false);
  });

  it("should persist eligibility in store when first evaluated", () => {
    const { store } = renderHook(
      () => useOnboardingWidgetVisibility(),
      stateWith({ eligibility: null }),
    );
    expect(store.getState().postOnboarding.walletEntryPointEligibleForPortfolio).toBe(true);
  });
});
