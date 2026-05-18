import { BigNumber } from "bignumber.js";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useAssetGroupPnL } from "@ledgerhq/wallet-pnl/hooks";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import type { PnLCardProps } from "LLD/features/PnL/components/PnLCard/types";
import { useAssetPnlViewModel } from "../useAssetPnlViewModel";

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

type RenderOptions = Parameters<
  typeof renderHook<ReturnType<typeof useAssetPnlViewModel>, never>
>[1];

const renderAssetPnlViewModel = (
  options: RenderOptions = {},
  item: DistributionItem = distributionItem,
) => renderHook(() => useAssetPnlViewModel({ distributionItem: item }), options);

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

describe("useAssetPnlViewModel", () => {
  it("derives shouldDisplayPnl from the wallet feature flag", () => {
    const on = renderAssetPnlViewModel({ initialState: flagsOn });
    expect(on.result.current.shouldDisplayPnl).toBe(true);

    const off = renderAssetPnlViewModel({ initialState: flagsOff });
    expect(off.result.current.shouldDisplayPnl).toBe(false);
  });

  it("hides the section when the distributionItem has no accounts", () => {
    const empty = buildDistributionItem({ currency: BTC_ACCOUNT.currency, accounts: [] });
    const { result } = renderAssetPnlViewModel({ initialState: flagsOn }, empty);

    expect(result.current.shouldDisplayPnl).toBe(false);
  });

  it("forwards the distributionItem accounts to useAssetGroupPnL", () => {
    renderAssetPnlViewModel({ initialState: flagsOn });

    expect(mockedUseAssetGroupPnL).toHaveBeenCalledWith(
      [BTC_ACCOUNT],
      expect.anything(),
      expect.anything(),
    );
  });

  it("emits unrealisedReturn + averageEntryPrice cards and a 3-bucket detail", () => {
    const { result } = renderAssetPnlViewModel({ initialState: flagsOn });

    expect(result.current.items.map(i => i.id)).toEqual(["unrealisedReturn", "averageEntryPrice"]);
    expect(result.current.detail.items).toHaveLength(3);
  });

  it("opens the detail dialog when the unrealisedReturn card is clicked", () => {
    const { result } = renderAssetPnlViewModel({ initialState: flagsOn });
    expect(result.current.dialog.isOpen).toBe(false);

    const [card] = result.current.items;
    assertInteractive(card);
    act(() => card.onClick());

    expect(result.current.dialog.isOpen).toBe(true);
  });
});
