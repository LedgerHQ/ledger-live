import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";

interface UsePortfolioEmptySectionViewModelResult {
  hasAccounts: boolean;
}

export const usePortfolioEmptySectionViewModel = (): UsePortfolioEmptySectionViewModelResult => {
  const hasAccounts = useSelector(state => flattenAccountsSelector(state).length > 0);
  return { hasAccounts };
};
