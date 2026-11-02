import type { AccountPortfolioToolProps } from "../types";
import { AccountPortfolioView } from "./AccountPortfolioView";
import { useAccountPortfolioViewModel } from "./useAccountPortfolioViewModel";

/** Container: the view model feeds a view that holds no logic of its own. */
function AccountPortfolio(props: AccountPortfolioToolProps) {
  return <AccountPortfolioView {...useAccountPortfolioViewModel(props)} />;
}

export default AccountPortfolio;
