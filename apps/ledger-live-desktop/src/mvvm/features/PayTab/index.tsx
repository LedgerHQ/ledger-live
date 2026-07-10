import React from "react";
import { Card } from "@card/core";
import PayTabHeader from "./components/PayTabHeader";

const PayTab = () => {
  return (
    <div className="flex flex-col gap-16 p-16">
      <PayTabHeader />
      <Card />
    </div>
  );
};

export default PayTab;
