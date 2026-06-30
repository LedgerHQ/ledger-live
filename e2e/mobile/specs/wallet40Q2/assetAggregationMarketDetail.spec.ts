import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

const DAI_ASSET_NAME = "Dai Stablecoin v2.0";
const DAI_TICKER = "DAI";
const USDT_ASSET_NAME = "Tether USD";
const USDT_TICKER = "USDT";
const USDT_MARKET_ID = "tether";
const USDT_MARKET_NAME = "Tether";
const ETHEREUM_ACCOUNT_ID = "js:2:ethereum:0xE32ad14b89F334dF1CD1036c2a0E39A19248b75a:";
const POLYGON_ACCOUNT_ID = "js:2:polygon:0xE32ad14b89F334dF1CD1036c2a0E39A19248b75a:";
const POLYGON_DAI_ACCOUNT_ID =
  "js:2:polygon:0xE32ad14b89F334dF1CD1036c2a0E39A19248b75a:+polygon%2Ferc20%2F(pos)~!underscore!~dai~!underscore!~stablecoin";
const POLYGON_DAI_ASSET_NAME = "(PoS) Dai Stablecoin";
const ASSET_AGGREGATION_FEATURE_FLAGS = {
  ...WALLET_40_FEATURE_FLAGS,
  lwmWallet40: {
    ...WALLET_40_FEATURE_FLAGS.lwmWallet40,
    params: {
      ...WALLET_40_FEATURE_FLAGS.lwmWallet40.params,
      assetDiscoverability: true,
      lazyOnboarding: false,
      tour: false,
    },
  },
} as const;

const getAddressFromAccountId = (accountId: string) => {
  const address = accountId.split(":")[3];
  if (!address) throw new Error(`Unable to resolve address from account id: ${accountId}`);
  return address;
};

const getAddressPrefix = (accountId: string) => getAddressFromAccountId(accountId).slice(0, 4);

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Asset Aggregation / Asset Market / Asset Detail", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding-with-last-seen-device",
      cliCommandsOnApp: [
        {
          app: Account.ETH_1.currency.speculosApp,
          cmd: liveDataCommand(Account.ETH_1),
        },
        {
          app: Account.POL_1.currency.speculosApp,
          cmd: liveDataCommand(Account.POL_1),
        },
      ],
      featureFlags: ASSET_AGGREGATION_FEATURE_FLAGS,
    });
    await app.mainNavigation.waitForWallet40Ready();
    await app.portfolio.closeAnalyticsConsentDrawerIfVisible(5_000);
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
    await app.assetDetail.openAddAccountNetworkDrawer();
    await app.assetDetail.expectAddAccountNetworkDrawer();
    await app.assetDetail.closeAddAccountNetworkDrawer();
    await app.assetDetail.expectHoldingAddressBalancesSumToTotal(
      [POLYGON_ACCOUNT_ID, ETHEREUM_ACCOUNT_ID],
      DAI_TICKER,
    );
  });

  $TmsLink("B2CQA-5523");
  $TmsLink("B2CQA-5526");
  it("shows asset detail market data, balances and transaction details", async () => {
    await app.assetDetail.expectAssetDetailPageForTicker(DAI_TICKER);
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
    await app.account.goBackFromAccountDetail();
    await app.assetDetail.expectAssetDetailPageForTicker(DAI_TICKER);
    await app.common.goToPreviousPage();
    if (await app.assetDetail.isAssetDetailPageVisible(1_000)) {
      await app.common.goToPreviousPage();
    }
    if (!(await app.portfolio.isStablecoinListPageVisible(3_000))) {
      await app.mainNavigation.waitForWallet40Ready();
      await app.portfolio.openStablecoinsListW40();
    }
    await app.portfolio.openAssetDetailW40(USDT_ASSET_NAME, app.portfolio.stablecoinListId);
    await app.assetDetail.expectAssetDetailPageForTicker(USDT_TICKER);
    await app.assetDetail.addToFavorites();
    const favoriteActionLabel =
      await app.assetDetail.getFavoriteActionLabel("Remove from favorites");
    expect(favoriteActionLabel).toContain("Remove from favorites");
    await app.assetDetail.closeCoinOptions();

    await app.common.goToPreviousPage();
    if (await app.assetDetail.isAssetDetailPageVisible(1_000)) {
      await app.common.goToPreviousPage();
    }
    if (await app.portfolio.isStablecoinListPageVisible(3_000)) {
      await app.common.goToPreviousPage();
    }
    await app.mainNavigation.waitForWallet40Ready();
    await app.common.disableSynchronizationForAndroid();
    try {
      await app.portfolio.expectMarketBannerVisible("up");
      await app.portfolio.tapMarketBannerTitle();
      await app.market.expectMarketScreenVisible();
      await app.market.filterStarredAssetsOnMarketScreen();
      await app.market.expectMarketScreenItemVisible(USDT_MARKET_ID, USDT_MARKET_NAME);
    } finally {
      await app.common.enableSynchronizationForAndroid();
    }
  });
});
