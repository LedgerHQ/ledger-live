import { renderHook } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { useStake } from "LLD/hooks/useStake";
import { useMetricsRowSectionViewModel } from "../useMetricsRowSectionViewModel";

jest.mock("LLD/hooks/useStake", () => ({
  useStake: jest.fn(),
}));

const mockedUseStake = jest.mocked(useStake);

const distributionItem = buildDistributionItem({
  currency: BTC_ACCOUNT.currency,
  accounts: [BTC_ACCOUNT],
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseStake.mockReturnValue({
    getCanStakeCurrency: jest.fn().mockReturnValue(true),
  } as unknown as ReturnType<typeof useStake>);
});

describe("useMetricsRowSectionViewModel", () => {
  it("shows the section when PnL is visible", () => {
    mockedUseStake.mockReturnValue({
      getCanStakeCurrency: jest.fn().mockReturnValue(false),
    } as unknown as ReturnType<typeof useStake>);

    const { result } = renderHook(() => useMetricsRowSectionViewModel({ distributionItem }));

    expect(result.current).toEqual({ shouldRenderSection: true });
  });

  it("shows the section when staking is visible and the asset has no accounts", () => {
    const empty = buildDistributionItem({ currency: BTC_ACCOUNT.currency, accounts: [] });
    const { result } = renderHook(() => useMetricsRowSectionViewModel({ distributionItem: empty }));

    expect(result.current).toEqual({ shouldRenderSection: true });
  });

  it("hides the section when neither PnL nor staking is visible", () => {
    mockedUseStake.mockReturnValue({
      getCanStakeCurrency: jest.fn().mockReturnValue(false),
    } as unknown as ReturnType<typeof useStake>);

    const empty = buildDistributionItem({ currency: BTC_ACCOUNT.currency, accounts: [] });
    const { result } = renderHook(() => useMetricsRowSectionViewModel({ distributionItem: empty }));

    expect(result.current).toEqual({ shouldRenderSection: false });
  });
});
