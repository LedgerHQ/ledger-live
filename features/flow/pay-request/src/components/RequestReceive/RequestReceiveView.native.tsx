import React from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { RequestReceiveActions } from "./RequestReceiveActions.native";
import { RequestReceiveSummary } from "./RequestReceiveSummary.native";
import { HINT_ENTER_MS, RequestReceiveVerifyHint } from "./RequestReceiveVerifyHint.native";
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
  verifyHint,
}: RequestReceiveViewProps) {
  const { hasCopied, hint, handleCopy, handleClose } = useRequestReceiveView({
    onCopy,
    onClose,
    verifyHint,
  });

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }} testID="pay-request-receive">
      {hint?.open ? (
        <Animated.View
          entering={FadeIn.duration(HINT_ENTER_MS)}
          pointerEvents="auto"
          testID="pay-request-receive-verify-hint-overlay"
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1 }]}
        />
      ) : null}
      <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }}>
        <IconButton
          icon={Close}
          appearance="no-background"
          size="md"
          onPress={handleClose}
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
        {hint ? <RequestReceiveVerifyHint {...hint} /> : null}
        <RequestReceiveActions
          labels={labels.actions}
          visibleActions={visibleActions}
          hasCopied={hasCopied}
          onShare={onShare}
          onCopy={handleCopy}
          onSave={onSave}
          onVerify={onVerify}
          dimOtherActions={hint?.open}
        />
      </Box>
    </Box>
  );
}
