import React from "react";
import { PayTabView } from "./PayTabView";
import { usePayTabViewModel } from "./usePayTabViewModel";

const PayTab = () => <PayTabView {...usePayTabViewModel()} />;

export default PayTab;
