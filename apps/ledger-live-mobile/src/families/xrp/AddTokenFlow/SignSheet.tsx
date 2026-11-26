import React from "react";
import type { InfoStateProps } from "@shared/ui-info-state";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";
import {
  makeBroadcastingInfoState,
  SignAndBroadcastSheet,
} from "../components/SignAndBroadcast/SignAndBroadcastSheet";
import type {
  SignAndBroadcast,
  SignInfoStep,
} from "../components/SignAndBroadcast/useSignAndBroadcast";

type Props = Readonly<{ flow: SignAndBroadcast<never>; accountId: string }>;

const TRACK_NAMES: Record<SignInfoStep, string> = {
  broadcasting: "Broadcasting",
  success: "ValidationSuccess",
  error: "ValidationError",
};

function useInfoState(flow: SignAndBroadcast<never>): InfoStateProps {
  const { t } = useTranslation();

  switch (flow.infoStep) {
    // Success leaves the sheet for the Confirmation screen, which the sheet keeps showing as it closes
    case "broadcasting":
    case "success":
      return makeBroadcastingInfoState(
        t("send.newSendFlow.processingTransaction"),
        "xrp-add-token-broadcasting",
      );
    case "error":
      return {
        preset: "error",
        title: t("xrp.addToken.error.title"),
        description: <TranslatedError error={flow.signError} />,
        testID: "xrp-add-token-error",
        banner: flow.isSigned
          ? {
              appearance: "warning",
              description: t("xrp.tokenSettings.error.broadcastError"),
              testID: "xrp-add-token-broadcast-error",
            }
          : undefined,
        primaryCta: {
          label: t("common.tryAgain"),
          onPress: flow.onSign,
          testID: "xrp-add-token-retry",
        },
        secondaryCta: {
          label: t("common.close"),
          onPress: flow.onClose,
          testID: "xrp-add-token-close",
        },
      };
  }
}

export default function SignSheet({ flow, accountId }: Props) {
  const infoState = useInfoState(flow);

  return (
    <SignAndBroadcastSheet
      flow={flow}
      infoState={infoState}
      trackCategory="XrpAddTokenFlow"
      trackName={TRACK_NAMES[flow.infoStep]}
      testID="xrp-add-token-sheet"
      accountId={accountId}
    />
  );
}
