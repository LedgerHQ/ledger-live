import React from "react";
import type { InfoStateProps } from "@shared/ui-info-state";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";
import {
  makeBroadcastingInfoState,
  SignAndBroadcastSheet,
} from "../components/SignAndBroadcast/SignAndBroadcastSheet";
import type { SignInfoStep } from "../components/SignAndBroadcast/useSignAndBroadcast";
import type { useSignTokenEdit } from "./useSignTokenEdit";

type ViewModel = ReturnType<typeof useSignTokenEdit>;

type Props = Readonly<{ viewModel: ViewModel }>;

const TRACK_NAMES: Record<SignInfoStep, string> = {
  broadcasting: "EditBroadcasting",
  success: "EditSuccess",
  error: "EditError",
};

function useInfoState(viewModel: ViewModel): InfoStateProps {
  const { t } = useTranslation();
  const closeCta = { label: t("common.close"), onPress: viewModel.onClose };

  switch (viewModel.infoStep) {
    case "broadcasting":
      return makeBroadcastingInfoState(
        t("send.newSendFlow.processingTransaction"),
        "xrp-edit-token-broadcasting",
      );
    case "success":
      return {
        preset: "success",
        title: t("xrp.tokenSettings.success.title"),
        description: t("xrp.tokenSettings.success.description"),
        secondaryCta: closeCta,
        testID: "xrp-edit-token-success",
        primaryCta: {
          label: t("send.validation.button.details"),
          onPress: viewModel.onViewDetails,
          testID: "xrp-edit-token-view-details",
        },
      };
    case "error":
      return {
        preset: "error",
        testID: "xrp-edit-token-error",
        title: t("xrp.tokenSettings.error.title"),
        description: <TranslatedError error={viewModel.signError} />,
        secondaryCta: closeCta,
        banner: viewModel.isSigned
          ? {
              appearance: "warning",
              description: t("xrp.tokenSettings.error.broadcastError"),
              testID: "xrp-edit-token-broadcast-error",
            }
          : undefined,
        primaryCta: {
          label: t("common.retry"),
          onPress: viewModel.onSign,
          testID: "xrp-edit-token-retry",
        },
      };
  }
}

export default function SignTokenEditSheets(props: Props) {
  const infoState = useInfoState(props.viewModel);

  return (
    <SignAndBroadcastSheet
      flow={props.viewModel}
      infoState={infoState}
      trackName={TRACK_NAMES[props.viewModel.infoStep]}
      testID="xrp-edit-token-sheet"
    />
  );
}
