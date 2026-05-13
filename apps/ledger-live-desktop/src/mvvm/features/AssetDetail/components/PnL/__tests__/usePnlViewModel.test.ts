import { BigNumber } from "bignumber.js";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useAssetGroupPnL } from "@ledgerhq/wallet-pnl/hooks";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import type { PnLCardProps } from "LLD/features/PnL/components/PnLCard/types";
import { usePnlViewModel } from "../usePnlViewModel";

jest.mock("@ledgerhq/wallet-pnl/hooks", () => ({
  useAssetGroupPnL: jest.fn(),
}));

const mockedUseAssetGroupPnL = jest.mocked(useAssetGroupPnL);

const ZERO = new BigNumber(0);

const flagsOn = withFlagOverrides({ lwdWallet40: { enabled: true, params: { pnl: true } } });
const flagsOff = withFlagOverrides({ lwdWallet40: { enabled: false } });

const distributionItem = buildDistributionItem({
  currency: BTC_ACCOUNT.currency,
  accounts: [BTC_ACCOUNT],
});

type RenderOptions = Parameters<typeof renderHook<ReturnType<typeof usePnlViewModel>, never>>[1];

const renderPnlViewModel = (
  options: RenderOptions = {},
  item: DistributionItem = distributionItem,
) => renderHook(() => usePnlViewModel({ distributionItem: item }), options);

function assertInteractive(
  card: PnLCardProps,
): asserts card is PnLCardProps & { type: "interactive" } {
  if (card.type !== "interactive") throw new Error("expected interactive card");
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAssetGroupPnL.mockReturnValue({
    unrealisedPnL: ZERO,
    realisedPnL: ZERO,
    totalPnL: ZERO,
    costBasis: ZERO,
    lifetimeCost: ZERO,
    totalAmount: ZERO,
    averageEntryPrice: ZERO,
  });
});

describe("usePnlViewModel", () => {
  it("derives shouldDisplayPnl from the wallet feature flag", () => {
    const on = renderPnlViewModel({ initialState: flagsOn });
    expect(on.result.current.shouldDisplayPnl).toBe(true);

    const off = renderPnlViewModel({ initialState: flagsOff });
    expect(off.result.current.shouldDisplayPnl).toBe(false);
  });

  it("hides the section when the distributionItem has no accounts, even with the feature flag on", () => {
    const emptyDistributionItem = buildDistributionItem({
      currency: BTC_ACCOUNT.currency,
      accounts: [],
    });
    const { result } = renderPnlViewModel({ initialState: flagsOn }, emptyDistributionItem);

    expect(result.current.shouldDisplayPnl).toBe(false);
  });

  it("forwards the distributionItem accounts to useAssetGroupPnL", () => {
    renderPnlViewModel({ initialState: flagsOn });

    expect(mockedUseAssetGroupPnL).toHaveBeenCalledWith(
      [BTC_ACCOUNT],
      expect.anything(),
      expect.anything(),
    );
  });

  it("emits zero-valued cards and a 3-bucket detail when useAssetGroupPnL returns null", () => {
    mockedUseAssetGroupPnL.mockReturnValue(null);

    const { result } = renderPnlViewModel({ initialState: flagsOn });

    expect(result.current.items.map(i => i.id)).toEqual(["unrealisedReturn", "averageEntryPrice"]);
    expect(result.current.detail.items).toHaveLength(3);
  });

  it("opens the detail dialog when the unrealisedReturn card is clicked", () => {
    const { result } = renderPnlViewModel({ initialState: flagsOn });
    expect(result.current.dialog.isOpen).toBe(false);

    const [unrealisedReturnCard] = result.current.items;
    assertInteractive(unrealisedReturnCard);
    act(() => unrealisedReturnCard.onClick());

    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("closes the detail dialog when onOpenChange(false) is called", () => {
    const { result } = renderPnlViewModel({ initialState: flagsOn });

    const [unrealisedReturnCard] = result.current.items;
    assertInteractive(unrealisedReturnCard);
    act(() => unrealisedReturnCard.onClick());
    expect(result.current.dialog.isOpen).toBe(true);

    act(() => result.current.dialog.onOpenChange(false));
    expect(result.current.dialog.isOpen).toBe(false);
  });
});
