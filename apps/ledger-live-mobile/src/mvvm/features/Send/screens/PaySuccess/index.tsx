import React from "react";
import { PaySuccess } from "@features/flow-pay-contact";
import SafeAreaView from "~/components/SafeAreaView";
import { usePaySuccessViewModel } from "./usePaySuccessViewModel";

export function PaySuccessScreen() {
  const viewModel = usePaySuccessViewModel();

  return (
    <SafeAreaView edges={["bottom"]}>
      <PaySuccess {...viewModel} />
    </SafeAreaView>
  );
}
