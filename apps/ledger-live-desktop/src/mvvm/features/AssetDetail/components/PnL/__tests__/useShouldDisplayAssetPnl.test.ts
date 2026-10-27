import type { DistributionItem } from "@ledgerhq/types-live";
import { renderHook } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { useShouldDisplayAssetPnl } from "../useShouldDisplayAssetPnl";

const distributionItem = buildDistributionItem({
  currency: BTC_ACCOUNT.currency,
  accounts: [BTC_ACCOUNT],
});

const renderShouldDisplayAssetPnl = (item: DistributionItem = distributionItem) =>
  renderHook(() => useShouldDisplayAssetPnl(item));

describe("useShouldDisplayAssetPnl", () => {
  it("returns true when the distribution item has accounts", () => {
    const { result } = renderShouldDisplayAssetPnl();

    expect(result.current).toBe(true);
  });

  it("returns false when the distribution item has no accounts", () => {
    const empty = buildDistributionItem({ currency: BTC_ACCOUNT.currency, accounts: [] });
    const { result } = renderShouldDisplayAssetPnl(empty);

    expect(result.current).toBe(false);
  });
});
