import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";

import type { OptionalFeatureMap, PartialFeatures } from "@shared/feature-flags";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

const DAI_ASSET_NAME = "Dai Stablecoin v2.0";
const DAI_TICKER = "DAI";
const ETHEREUM_ACCOUNT_ID = "js:2:ethereum:0xE32ad14b89F334dF1CD1036c2a0E39A19248b75a:";
const POLYGON_ACCOUNT_ID = "js:2:polygon:0xE32ad14b89F334dF1CD1036c2a0E39A19248b75a:";

const ASSET_AGGREGATION_FEATURE_FLAGS = {
  lwmWallet40: {
    ...WALLET_40_FEATURE_FLAGS.lwmWallet40,
    params: {
      ...WALLET_40_FEATURE_FLAGS.lwmWallet40.params,
      aggregatedAssets: true,
      assetSection: true,
      lazyOnboarding: false,
      tour: false,
    },
  },
} satisfies OptionalFeatureMap;

const getAddressFromAccountId = (accountId: string) => {
  const address = accountId.split(":")[3];
  if (!address) throw new Error(`Unable to resolve address from account id: ${accountId}`);
  return address;
};

const getAddressPrefix = (accountId: string) => getAddressFromAccountId(accountId).slice(0, 4);

const isAggregatedAssetsDisabledByJson = () =>
  parseExtraFeatureFlags<PartialFeatures>(process.env.E2E_FEATURE_FLAGS_JSON).lwmWallet40
    ?.params?.aggregatedAssets === false;

const describeWithAggregatedAssets = isAggregatedAssetsDisabledByJson() ? describe.skip : describe;

setTeamOwner(Team.WALLET_XP);
describeWithAggregatedAssets("Wallet 4.0 - Asset Aggregation / Asset Market / Asset Detail", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-many-stablecoins",
      featureFlags: ASSET_AGGREGATION_FEATURE_FLAGS,
    });
    await app.mainNavigation.waitForWallet40Ready();
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
    await app.assetDetail.expectTotalBalanceCryptoForTicker(DAI_TICKER);
    await app.assetDetail.expectHoldingAddressDetails(
      [
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
      ],
      DAI_TICKER,
    );
    await app.assetDetail.expectHoldingAddressBalancesSumToTotal(
      [POLYGON_ACCOUNT_ID, ETHEREUM_ACCOUNT_ID],
      DAI_TICKER,
    );
  });
});
