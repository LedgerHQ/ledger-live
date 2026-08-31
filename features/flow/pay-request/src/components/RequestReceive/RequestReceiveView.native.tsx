import React from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { RequestReceiveActions } from "./RequestReceiveActions.native";
import { RequestReceiveSummary } from "./RequestReceiveSummary.native";
import { useRequestReceiveView } from "./useRequestReceiveView.native";
import type { RequestReceiveViewProps } from "../../types";

export function RequestReceiveView({
  labels,
  assetIcon,
  networkIcon,
  visibleActions,
  addressParts,
  qrPayload,
  cardRef,
  onClose,
  onShare,
  onCopy,
  onSave,
  onVerify,
}: RequestReceiveViewProps) {
  const { hasCopied, handleCopy } = useRequestReceiveView({ onCopy });

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }} testID="pay-request-receive">
      <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }}>
        <IconButton
          icon={Close}
          appearance="no-background"
          size="md"
          onPress={onClose}
          accessibilityLabel="Close"
          testID="pay-request-receive-close"
        />
      </Box>
      <Box
        lx={{
          flex: 1,
          marginTop: "s24",
          paddingHorizontal: "s8",
        }}
      >
        <RequestReceiveSummary
          title={labels.title}
          networkLabel={labels.networkLabel}
          assetIcon={assetIcon}
          networkIcon={networkIcon}
          addressParts={addressParts}
          qrPayload={qrPayload}
          cardRef={cardRef}
        />
      </Box>
      <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
        <RequestReceiveActions
          labels={labels.actions}
          visibleActions={visibleActions}
          hasCopied={hasCopied}
          onShare={onShare}
          onCopy={handleCopy}
          onSave={onSave}
          onVerify={onVerify}
        />
      </Box>
    </Box>
  );
}
