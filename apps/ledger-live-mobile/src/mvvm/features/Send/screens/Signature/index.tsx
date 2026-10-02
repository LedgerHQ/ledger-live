import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredSend } from "../../context/SponsoredSendContext";
import { SignatureExecutorScreen } from "./SignatureExecutorScreen";
import { SignatureDeviceActionScreen } from "./SignatureDeviceActionScreen";

export function SignatureScreen() {
  const useDeviceActionSignature = useFeature("useDeviceActionSignatureSend")?.enabled ?? false;
  // Only the executor path reports a sponsored transfer's outcome to the orchestration.
  const sponsoredTransfer = useSponsoredSend().state.phase === SPONSORED_PHASE.TRANSFER;

  return useDeviceActionSignature && !sponsoredTransfer ? (
    <SignatureDeviceActionScreen />
  ) : (
    <SignatureExecutorScreen />
  );
}
