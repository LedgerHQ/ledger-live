import React from "react";
import { useSelector } from "~/context/store";
import { accountsSelector } from "~/reducers/accounts";
import OperationsHistory from "../WalletCentricSections/OperationsHistory";

const PortfolioOperationHistorySection = () => {
  const accounts = useSelector(accountsSelector);
  return <OperationsHistory accounts={accounts} testID="portfolio-operation-history-section" />;
};

export default React.memo(PortfolioOperationHistorySection);
