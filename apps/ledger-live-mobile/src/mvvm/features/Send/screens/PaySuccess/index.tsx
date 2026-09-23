import React, { useMemo } from "react";
import { PaySuccess } from "@features/flow-pay-contact";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import SafeAreaView from "~/components/SafeAreaView";
import { usePaySuccessViewModel } from "./usePaySuccessViewModel";
import { useSendFlowTracking } from "../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../hooks/useSendFlowTrackingProperties";
import { TrackScreen } from "~/analytics";

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
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <TrackScreen category="Modal send - transaction sent" {...trackingProperties} />
      <PaySuccess {...viewModel} />
    </SafeAreaView>
  );
}
