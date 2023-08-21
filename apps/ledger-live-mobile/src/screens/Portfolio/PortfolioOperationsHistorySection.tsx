import React from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "../../reducers/accounts";
import OperationsHistory from "../WalletCentricSections/OperationsHistory";

const PortfolioOperationHistorySection = () => {
  const accounts = useSelector(accountsSelector);
  return <OperationsHistory accounts={accounts} />;
};

export default React.memo(PortfolioOperationHistorySection);
