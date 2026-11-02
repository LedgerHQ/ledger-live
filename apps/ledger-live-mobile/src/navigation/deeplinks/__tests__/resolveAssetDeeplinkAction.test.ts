import { resolveAssetDeeplinkAction } from "../resolveAssetDeeplinkAction";

const coin = { currencyId: "bitcoin", assetId: "bitcoin" };
const token = {
  currencyId: "ethereum",
  assetId: "ethereum/erc20/usd_tether__erc20_",
  ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
};

describe("resolveAssetDeeplinkAction", () => {
  it("opens asset detail for a coin without market state", () => {
    expect(resolveAssetDeeplinkAction(coin)).toEqual({
      kind: "asset-detail",
      currencyId: "bitcoin",
      marketState: undefined,
    });
  });

  it("opens asset detail for a token carrying its market state", () => {
    expect(resolveAssetDeeplinkAction(token)).toEqual({
      kind: "asset-detail",
      currencyId: "ethereum/erc20/usd_tether__erc20_",
      marketState: {
        id: "ethereum/erc20/usd_tether__erc20_",
        ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
      },
    });
  });
});
