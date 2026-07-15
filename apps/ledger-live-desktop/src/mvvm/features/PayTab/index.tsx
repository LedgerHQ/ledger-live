import React from "react";
import { CardScreen } from "@features/flow-card";
import PayTabHeader from "./components/PayTabHeader";

const PayTab = () => {
  return (
    <>
      <PayTabHeader />
      <CardScreen />
    </>
  );
};

export default PayTab;
