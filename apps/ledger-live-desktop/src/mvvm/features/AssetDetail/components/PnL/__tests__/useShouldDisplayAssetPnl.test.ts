import type { DistributionItem } from "@ledgerhq/types-live";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { useShouldDisplayAssetPnl } from "../useShouldDisplayAssetPnl";

const flagsOn = withFlagOverrides({ lwdWallet40: { enabled: true, params: { pnl: true } } });
const flagsOff = withFlagOverrides({ lwdWallet40: { enabled: false } });

const distributionItem = buildDistributionItem({
  currency: BTC_ACCOUNT.currency,
  accounts: [BTC_ACCOUNT],
});

const renderShouldDisplayAssetPnl = (
  options: Parameters<typeof renderHook<boolean, never>>[1] = {},
  item: DistributionItem = distributionItem,
) => renderHook(() => useShouldDisplayAssetPnl(item), options);

describe("useShouldDisplayAssetPnl", () => {
  it("derives visibility from the wallet feature flag and account count", () => {
    const on = renderShouldDisplayAssetPnl({ initialState: flagsOn });
    expect(on.result.current).toBe(true);

    const off = renderShouldDisplayAssetPnl({ initialState: flagsOff });
    expect(off.result.current).toBe(false);
  });

  it("returns false when the distribution item has no accounts", () => {
    const empty = buildDistributionItem({ currency: BTC_ACCOUNT.currency, accounts: [] });
    const { result } = renderShouldDisplayAssetPnl({ initialState: flagsOn }, empty);

    expect(result.current).toBe(false);
  });
});
