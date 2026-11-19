import React from "react";
import { useFamilyDialogsViewModel } from "./useFamilyDialogsViewModel";

const FamilyDialogs = () => {
  const viewModel = useFamilyDialogsViewModel();
  if (!viewModel) return null;

  const { AccountDialog, ...props } = viewModel;

  return <AccountDialog {...props} />;
};

export default FamilyDialogs;
