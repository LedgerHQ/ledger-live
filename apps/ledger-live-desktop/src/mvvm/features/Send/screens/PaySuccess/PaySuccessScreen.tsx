import React, { useMemo } from "react";
import { PaySuccess } from "@features/flow-pay-contact";
import { usePaySuccessViewModel } from "./hooks/usePaySuccessViewModel";
import { useSendFlowTracking } from "../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../hooks/useSendFlowTrackingProperties";
import TrackPage from "~/renderer/analytics/TrackPage";

export function PaySuccessScreen() {
  const viewModel = usePaySuccessViewModel();
  const { recipientType, savedContactDuringFlow } = useSendFlowTracking();
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const trackingProperties = useMemo(
    () => ({
      ...sendFlowTrackingProperties,
      recipientType,
      savedContactDuringFlow,
    }),
    [recipientType, savedContactDuringFlow, sendFlowTrackingProperties],
  );

  return (
    <>
      <TrackPage
        category="Modal send - transaction sent"
        refreshSource={false}
        {...trackingProperties}
      />
      <PaySuccess {...viewModel} />
    </>
  );
}
