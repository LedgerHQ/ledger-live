import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { DistributionItem } from "@ledgerhq/types-live";
import * as walletPnlHooks from "@ledgerhq/wallet-pnl/hooks";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { PnLSection, ASSET_DETAIL_PNL_TEST_IDS } from "..";

const btc = getCryptoCurrencyById("bitcoin");
const btcAccount = genAccount("btc-1", { currency: btc, operationsSize: 0 });

const distributionItem: DistributionItem = {
  currency: btc,
  distribution: 1,
  accounts: [btcAccount],
  amount: 0,
};

const emptyDistributionItem: DistributionItem = {
  currency: btc,
  distribution: 0,
  accounts: [],
  amount: 0,
};

const withPnl = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

describe("AssetDetail PnLSection", () => {
  it("renders the section when the pnl flag is on and the asset has accounts", () => {
    render(<PnLSection distributionItem={distributionItem} isLoading={false} />, {
      overrideInitialState: withPnl(true),
    });

    expect(screen.getByTestId(ASSET_DETAIL_PNL_TEST_IDS.root)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_PNL_TEST_IDS.unrealisedCard)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_PNL_TEST_IDS.secondaryCard)).toBeVisible();
  });

  it("renders nothing when the pnl flag is off", () => {
    render(<PnLSection distributionItem={distributionItem} isLoading={false} />, {
      overrideInitialState: withPnl(false),
    });

    expect(screen.queryByTestId(ASSET_DETAIL_PNL_TEST_IDS.root)).toBeNull();
  });

  it("renders nothing when the asset has no accounts", () => {
    render(<PnLSection distributionItem={emptyDistributionItem} isLoading={false} />, {
      overrideInitialState: withPnl(true),
    });

    expect(screen.queryByTestId(ASSET_DETAIL_PNL_TEST_IDS.root)).toBeNull();
  });

  it("renders nothing when distributionItem is undefined and not loading", () => {
    render(<PnLSection distributionItem={undefined} isLoading={false} />, {
      overrideInitialState: withPnl(true),
    });

    expect(screen.queryByTestId(ASSET_DETAIL_PNL_TEST_IDS.root)).toBeNull();
  });

  it("renders a skeleton when loading without a distributionItem", () => {
    render(<PnLSection distributionItem={undefined} isLoading />, {
      overrideInitialState: withPnl(true),
    });

    expect(screen.getByTestId("asset-detail-section-skeleton")).toBeVisible();
  });

  describe("useAssetGroupPnL short-circuit", () => {
    let spy: jest.SpyInstance<
      ReturnType<typeof walletPnlHooks.useAssetGroupPnL>,
      Parameters<typeof walletPnlHooks.useAssetGroupPnL>
    >;

    beforeEach(() => {
      spy = jest.spyOn(walletPnlHooks, "useAssetGroupPnL");
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("does not invoke useAssetGroupPnL when the flag is off (section unmounted)", () => {
      render(<PnLSection distributionItem={distributionItem} isLoading={false} />, {
        overrideInitialState: withPnl(false),
      });

      expect(spy).not.toHaveBeenCalled();
    });

    it("forwards the real accounts when the flag is on and the asset has accounts", () => {
      render(<PnLSection distributionItem={distributionItem} isLoading={false} />, {
        overrideInitialState: withPnl(true),
      });

      expect(spy).toHaveBeenCalledWith(
        distributionItem.accounts,
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
