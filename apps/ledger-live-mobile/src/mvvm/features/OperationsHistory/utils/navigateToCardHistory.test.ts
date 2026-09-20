import { NavigatorName, ScreenName } from "~/const";
import { HISTORY_TAB_CARD } from "LLM/features/OperationsHistory/constants";
import { navigateToCardHistory } from "./navigateToCardHistory";

describe("navigateToCardHistory", () => {
  it("opens the shared Card history without an asset filter", () => {
    const navigate = jest.fn();

    navigateToCardHistory({ navigate });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { historyTab: HISTORY_TAB_CARD },
    });
  });

  it("carries one provider asset code for asset-scoped history", () => {
    const navigate = jest.fn();

    navigateToCardHistory({ navigate }, "usdc");

    expect(navigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { historyTab: HISTORY_TAB_CARD, asset: "usdc" },
    });
  });
});
