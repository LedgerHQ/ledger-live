import React from "react";
import BaanxLoginScreenView from "./BaanxLoginScreenView";
import { useBaanxLoginViewModel } from "./useBaanxLoginViewModel";

export const BaanxLoginScreen = () => {
  const viewModel = useBaanxLoginViewModel();
  return <BaanxLoginScreenView {...viewModel} />;
};
