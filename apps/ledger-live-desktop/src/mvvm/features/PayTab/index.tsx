import React from "react";
import { useTranslation } from "react-i18next";
import { CardLogin } from "@features/flow-pay-card-auth";
import { PayCardBalance } from "@features/flow-pay-card-balance";
import TrackPage from "~/renderer/analytics/TrackPage";
import { openURL } from "~/renderer/linking";
import PayTabHeader from "./components/PayTabHeader";
import { usePayCardBalance } from "./hooks/usePayCardBalance";

const openHostedLogin = (loginUrl: string) => openURL(loginUrl, "");

const PayTab = () => {
  const { t } = useTranslation();
  const balance = usePayCardBalance();

  return (
    <>
      <TrackPage category="Pay" balance_filter={balance.filter} />
      <PayTabHeader />
      <PayCardBalance
        {...balance}
        labels={{
          emptyTitle: t("payTab.balance.emptyTitle"),
          emptyDescription: t("payTab.balance.emptyDescription"),
        }}
      />
      <CardLogin openHostedLogin={openHostedLogin} />
    </>
  );
};

export default PayTab;
