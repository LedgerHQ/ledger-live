import { NavigatorName, ScreenName } from "~/const";
import { navigateToPortfolio } from "../navigateToPortfolio";

describe("navigateToPortfolio", () => {
  it("should navigate to the portfolio screen", () => {
    const navigate = jest.fn();

    navigateToPortfolio({ navigate });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.Main, {
      screen: NavigatorName.Portfolio,
      params: { screen: ScreenName.Portfolio },
    });
  });
});
