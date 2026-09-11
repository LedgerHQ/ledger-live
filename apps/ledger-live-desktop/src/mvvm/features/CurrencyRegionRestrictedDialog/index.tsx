import React from "react";
import useCurrencyRegionRestrictedDialogViewModel from "./useCurrencyRegionRestrictedDialogViewModel";
import CurrencyRegionRestrictedDialogView from "./CurrencyRegionRestrictedDialogView";

const CurrencyRegionRestrictedDialog = () => (
  <CurrencyRegionRestrictedDialogView {...useCurrencyRegionRestrictedDialogViewModel()} />
);

export default CurrencyRegionRestrictedDialog;
