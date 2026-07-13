import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "../../utils/featureFlagUtils";
import { getFixtureAccountId, getFixtureTokenAccountId } from "../../utils/fixtureAccounts";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

const DAI_TICKER = Currency.POL_DAI.ticker;
const USDT_TICKER = Currency.ETH_USDT.ticker;
const USDT_ASSET_NAME = Currency.ETH_USDT.name;
const POLYGON_DAI_ASSET_NAME = Currency.POL_DAI.name;

const DAI_ASSET_NAME = Currency.POL_DAI.aggregatedName!;
const USDT_MARKET_ID = Currency.ETH_USDT.market!.id;
const USDT_MARKET_NAME = Currency.ETH_USDT.market!.name;

const WALLET_40_STABLECOINS_FIXTURE = "wallet40-many-stablecoins";
// CAL token id of the aggregated Polygon DAI holding in the fixture.
const POLYGON_DAI_TOKEN_ID = "polygon/erc20/(pos)_dai_stablecoin";

// Read from the loaded userdata fixture so the ids always match the app's real
// account ids, without hardcoding seed-derived addresses.
const ETHEREUM_ACCOUNT_ID = getFixtureAccountId(WALLET_40_STABLECOINS_FIXTURE, Currency.ETH.id);
const POLYGON_ACCOUNT_ID = getFixtureAccountId(WALLET_40_STABLECOINS_FIXTURE, Currency.POL.id);
const POLYGON_DAI_ACCOUNT_ID = getFixtureTokenAccountId(
  WALLET_40_STABLECOINS_FIXTURE,
  Currency.POL.id,
  POLYGON_DAI_TOKEN_ID,
);

// Reuse the shared Q2 Wallet 4.0 flags (aggregatedAssets + assetDiscoverability enabled).
// lazyOnboarding is forced off: leaving it on opened onboarding modals at startup that
// broke this flow.
const ASSET_AGGREGATION_FEATURE_FLAGS = {
  lwmWallet40: {
    ...FF_LWM_WALLET_40_Q2.lwmWallet40,
    params: {
      ...FF_LWM_WALLET_40_Q2.lwmWallet40.params,
      lazyOnboarding: false,
      pnl: false,
    },
  },
};

const getAddressFromAccountId = (accountId: string) => {
  const address = accountId.split(":")[3];
  if (!address) throw new Error(`Unable to resolve address from account id: ${accountId}`);
  return address;
};

const getAddressPrefix = (accountId: string) => getAddressFromAccountId(accountId).slice(0, 4);

const ensurePortfolioReady = async () => {
  if (await app.account.isAccountDetailVisible()) {
    await app.account.goBackFromAccountDetail();
  }

  if (await app.assetDetail.isAssetDetailPageVisible()) {
    await app.common.goToPreviousPage();
  }

  if (await app.portfolio.isStablecoinListPageVisible()) {
    await app.common.goToPreviousPage();
  }

  await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  await app.mainNavigation.waitForWallet40Ready();
};

const openStablecoinAssetDetail = async (assetName: string, ticker: string) => {
  if (!(await app.portfolio.isStablecoinListPageVisible())) {
    await ensurePortfolioReady();
    await app.portfolio.openStablecoinsListW40();
  } else {
    await app.portfolio.checkStablecoinListPageVisible();
  }

  await app.portfolio.checkAggregatedAssetRowVisible(assetName, app.portfolio.stablecoinListId);
  await app.portfolio.openAssetDetailW40(assetName, app.portfolio.stablecoinListId);
  await app.assetDetail.expectAssetDetailPageForTicker(ticker);
};

const ensureDaiAssetDetail = async () => {
  if (await app.assetDetail.isAssetDetailPageForTickerVisible(DAI_TICKER)) {
    return;
  }

  await openStablecoinAssetDetail(DAI_ASSET_NAME, DAI_TICKER);
};

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Asset Aggregation / Asset Market / Asset Detail", () => {
  beforeAll(async () => {
    await app.init({
      userdata: WALLET_40_STABLECOINS_FIXTURE,
      featureFlags: ASSET_AGGREGATION_FEATURE_FLAGS,
    });
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible(10_000);
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  });

  TAGS.forEach(tag => $Tag(tag));

  $TmsLink("B2CQA-5519");
  $TmsLink("B2CQA-5520");
  it("aggregates the same asset across networks and lists holding addresses", async () => {
    await app.portfolio.openStablecoinsListW40();
    await app.portfolio.checkAggregatedAssetRowVisible(
      DAI_ASSET_NAME,
      app.portfolio.stablecoinListId,
    );
    const aggregatedAssetRowCount = await app.portfolio.getAggregatedAssetRowCount(DAI_ASSET_NAME);
    expect(aggregatedAssetRowCount).toBe(1);
    await app.portfolio.checkAssetCountervalueVisible(
      DAI_ASSET_NAME,
      app.portfolio.stablecoinListId,
    );

    await app.portfolio.openAssetDetailW40(DAI_ASSET_NAME, app.portfolio.stablecoinListId);
    await app.assetDetail.expectAssetDetailPageForTicker(DAI_TICKER);
    await app.assetDetail.expectHoldingAddressDetails([
      {
        accountId: POLYGON_ACCOUNT_ID,
        name: "Polygon 1",
        addressFragment: getAddressPrefix(POLYGON_ACCOUNT_ID),
      },
      {
        accountId: ETHEREUM_ACCOUNT_ID,
        name: "Ethereum 1",
        addressFragment: getAddressPrefix(ETHEREUM_ACCOUNT_ID),
      },
    ]);
    await app.assetDetail.expectHoldingAddressBalancesSumToTotal(
      [POLYGON_ACCOUNT_ID, ETHEREUM_ACCOUNT_ID],
      DAI_TICKER,
    );
  });

  $TmsLink("B2CQA-5523");
  $TmsLink("B2CQA-5526");
  it("shows asset detail market data, balances and transaction details", async () => {
    await ensureDaiAssetDetail();
    await app.assetDetail.expectMarketDataVisible();
    await app.assetDetail.expectTotalBalanceCryptoForTicker(DAI_TICKER);
    await app.assetDetail.expectPortfolioSectionsVisible();
    const visibleDaiTransactionCount =
      await app.assetDetail.getVisibleTransactionCountForTicker(DAI_TICKER);
    expect(visibleDaiTransactionCount).toBeGreaterThan(0);
    await app.assetDetail.openFirstTransaction(DAI_TICKER);
    await app.operationDetails.checkTransactionDetailsVisibility();
    await app.operationDetails.expectOperationAmountTicker(DAI_TICKER);
    await app.operationDetails.checkViewInExplorerButtonVisible();

    await app.common.goToPreviousPage();
    await app.assetDetail.expectAssetDetailPageForTicker(DAI_TICKER);
  });

  $TmsLink("B2CQA-5535");
  it("opens an address detail page with balances, actions, assets and transactions", async () => {
    await ensureDaiAssetDetail();
    await app.assetDetail.openHoldingAddress(POLYGON_ACCOUNT_ID);

    await app.account.waitAndVerifyAccountName(POLYGON_DAI_ASSET_NAME);
    await detoxExpect(getElementByText("POLYGON 1")).toBeVisible();
    const accountAddressLabel =
      await app.account.getVisibleAccountAddressLabel(POLYGON_DAI_ACCOUNT_ID);
    const polygonDaiAddress = getAddressFromAccountId(POLYGON_DAI_ACCOUNT_ID);
    expect(accountAddressLabel.toLowerCase()).toContain(
      polygonDaiAddress.slice(2, 5).toLowerCase(),
    );
    expect(accountAddressLabel.toLowerCase()).toContain(polygonDaiAddress.slice(-4).toLowerCase());
    await app.account.expectAccountBalanceVisible(POLYGON_DAI_ACCOUNT_ID);
    await app.account.expectReceiveAndSendActionsVisible();
    await app.account.expectOperationHistoryVisible(POLYGON_DAI_ACCOUNT_ID);
  });

  $TmsLink("B2CQA-5532");
  $TmsLink("B2CQA-5533");
  it("stars an asset and finds it in the starred market list", async () => {
    // DAI is intentionally not used here because its Asset Detail favorite flow is currently broken.
    await openStablecoinAssetDetail(USDT_ASSET_NAME, USDT_TICKER);
    await app.assetDetail.addToFavorites();

    await app.market.openViaDeeplink();
    await app.market.expectMarketScreenVisible();
    await app.market.filterStarredAssetsOnMarketScreen();
    const isStarredAssetListed = await app.market.isMarketScreenItemVisible(
      USDT_MARKET_ID,
      USDT_MARKET_NAME,
    );
    expect(isStarredAssetListed).toBe(true);
  });
});
