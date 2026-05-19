import { NavigatorName } from "~/const";
import { navigateToPortfolioWalletTab } from "../navigateToPortfolioWalletTab";

describe("navigateToPortfolioWalletTab", () => {
  it("should navigate to the portfolio wallet tab", () => {
    const navigate = jest.fn();

    navigateToPortfolioWalletTab({ navigate });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.Main, {
      screen: NavigatorName.Portfolio,
      params: { screen: NavigatorName.WalletTab },
    });
  });
});
