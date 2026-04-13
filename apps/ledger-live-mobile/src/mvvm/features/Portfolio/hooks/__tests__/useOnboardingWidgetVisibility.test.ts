import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useOnboardingWidgetVisibility } from "../useOnboardingWidgetVisibility";
import subDays from "date-fns/subDays";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
const mockedEntryPointVisible = jest.mocked(usePostOnboardingEntryPointVisibleOnWallet);

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const accountWithFunds: Account = genAccount("onboarding-widget-with-funds", {
  currency: bitcoinCurrency,
});
accountWithFunds.balance = new BigNumber(1000);

interface StateWithParams {
  deviceModelId?: DeviceModelId | null;
  eligibility?: boolean | null;
  accounts?: Account[];
  featureFlagOff?: boolean;
  completionDate?: string | null;
}

function stateWith({
  deviceModelId = DeviceModelId.nanoX,
  eligibility = true,
  accounts = [],
  featureFlagOff = false,
  completionDate = subDays(new Date(), 2).toISOString(),
}: StateWithParams = {}) {
  return {
    overrideInitialState: withFlagOverrides(
      {
        lwmWallet40: featureFlagOff
          ? { enabled: false }
          : { enabled: true, params: { onboardingWidget: true } },
      },
      state => ({
        ...state,
        accounts: { active: accounts },
        postOnboarding: {
          ...state.postOnboarding,
          deviceModelId,
          walletEntryPointEligibleForPortfolio: eligibility,
        },
        settings: {
          ...state.settings,
          hasCompletedOnboarding: true,
          onboardingCompletionDate: completionDate,
        },
      }),
    ),
  };
}

describe("useOnboardingWidgetVisibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEntryPointVisible.mockReturnValue(true);
  });

  it.each([
    {
      desc: "all conditions met",
      expected: true,
    },
    { desc: "feature flag off", featureFlagOff: true, expected: false },
    { desc: "Nano S excluded", deviceModelId: DeviceModelId.nanoS, expected: false },
    { desc: "not eligible", eligibility: false, expected: false },
    { desc: "eligibility null + no funds", eligibility: null, expected: true },
    {
      desc: "eligibility null + has funds",
      eligibility: null,
      accounts: [accountWithFunds],
      expected: false,
    },
    {
      desc: "cutoff time reached",
      completionDate: subDays(new Date(), 16).toISOString(),
      expected: false,
    },
  ])("should return $expected when $desc", ({ expected, desc: _, ...overrides }) => {
    const { result } = renderHook(() => useOnboardingWidgetVisibility(), stateWith(overrides));
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
