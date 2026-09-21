import { NavigatorName, ScreenName } from "~/const";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { navigateToCardHistory } from "../navigateToCardHistory";

describe("navigateToCardHistory", () => {
  it("should navigate to the OperationsList screen with a Pay scope", () => {
    const navigate = jest.fn();

    navigateToCardHistory({ navigate });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { scope: { kind: "pay" } },
    });
  });

  it("should carry the selected asset in an asset scope", () => {
    const navigate = jest.fn();
    const asset: CardAssetRow = {
      id: "usdc",
      currency: "usdc",
      network: "ethereum",
      name: "USD Coin",
      ticker: "USDC",
      ledgerId: "ethereum/erc20/usd__coin",
      cryptoAmount: "100 USDC",
      countervalue: "$100.00",
      countervalueAmount: 100,
    };

    navigateToCardHistory({ navigate }, asset);

    expect(navigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { scope: { kind: "cardAsset", asset } },
    });
  });
});
