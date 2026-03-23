import { useNavigate } from "react-router";
import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";

export type HistoryViewModel = {
  navigateToDashboard: () => void;
  accounts: AccountLike[];
  filterOperations: (operation: Operation, account: AccountLike) => boolean;
  t: TFunction;
};

export default function useHistoryViewModel(): HistoryViewModel {
  // NB: This is the same logic as in the PortfolioViewModel & it will be reworked in next iterations
  // Same for tests
  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: shouldFilterTokenOpsZeroAmount,
  });

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      const isOperationPoisoned = isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );

      const shouldFilterOperation = !(shouldFilterTokenOpsZeroAmount && isOperationPoisoned);

      return shouldFilterOperation;
    },
    [shouldFilterTokenOpsZeroAmount, addressPoisoningFamilies],
  );
  const navigate = useNavigate();
  const accounts = useSelector(accountsSelector);
  const { t } = useTranslation();

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);
  return {
    navigateToDashboard,
    accounts,
    filterOperations,
    t,
  };
}
