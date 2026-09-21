import { NavigatorName, ScreenName } from "~/const";
import { HISTORY_TAB_CARD } from "LLM/features/OperationsHistory/constants";
import { navigateToCardHistory } from "../navigateToCardHistory";

describe("navigateToCardHistory", () => {
  it("should navigate to the OperationsList screen on the card tab", () => {
    const navigate = jest.fn();

    navigateToCardHistory({ navigate });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { historyTab: HISTORY_TAB_CARD },
    });
  });
});
