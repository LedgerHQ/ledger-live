import React, { lazy } from "react";
import { useLocation } from "react-router";
import AccountDetail from "./index";
import { useIsAccountDetailPage } from "./hooks/useIsAccountDetailPage";

const LegacyAccountPage = lazy(() => import("~/renderer/screens/account"));

const AccountDetailRoute = () => {
  const { pathname } = useLocation();

  return useIsAccountDetailPage(pathname) ? <AccountDetail /> : <LegacyAccountPage />;
};

export default AccountDetailRoute;
