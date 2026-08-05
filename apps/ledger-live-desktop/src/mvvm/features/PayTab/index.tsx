import React from "react";
import { CardLogin } from "@features/flow-pay-card-auth";
import { openURL } from "~/renderer/linking";
import PayTabHeader from "./components/PayTabHeader";

const openHostedLogin = (loginUrl: string) => openURL(loginUrl, "");

const PayTab = () => {
  return (
    <>
      <PayTabHeader />
      <CardLogin openHostedLogin={openHostedLogin} />
    </>
  );
};

export default PayTab;
