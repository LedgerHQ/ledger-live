import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView, Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState, type InfoStateProps } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";
import {
  type InfoStep,
  type Props,
  SIGNATURE_EXTRA_PROPS,
  useDeleteTokenViewModel,
} from "./useDeleteTokenViewModel";

const TRACK_NAMES: Record<InfoStep, string> = {
  blocked: "DeleteBlocked",
  confirm: "DeleteConfirm",
  broadcasting: "DeleteBroadcasting",
  success: "DeleteSuccess",
  error: "DeleteError",
};

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

function useInfoState(viewModel: ReturnType<typeof useDeleteTokenViewModel>): InfoStateProps {
  const { t, i18n } = useTranslation();

  const ticker = viewModel.token.ticker;

  switch (viewModel.infoStep) {
    case "blocked":
      return {
        preset: "error",
        title: t("xrp.manageAssets.deleteBlocked.title", { ticker }),
        description: t("xrp.manageAssets.deleteBlocked.description", { ticker }),
        primaryCta: { label: t("common.gotit"), onPress: viewModel.onClose },
        testID: "xrp-delete-token-blocked",
      };
    case "confirm": {
      const confirmKey =
        viewModel.token.tokenType === "iou"
          ? "xrp.manageAssets.deleteConfirm.descriptionIou"
          : "xrp.manageAssets.deleteConfirm.description";
      const statusError = viewModel.statusError;
      const values = statusError && { ...statusError, message: statusError.message };
      const titleKey = `errors.${statusError?.name}.title`;
      const descriptionKey = `errors.${statusError?.name}.description`;

      return {
        preset: "info",
        testID: "xrp-delete-token-confirm",
        title: t("xrp.manageAssets.deleteConfirm.title", { ticker }),
        description: t(confirmKey, { accountName: viewModel.accountName }),
        banner: statusError && {
          appearance: "error",
          title: t(i18n.exists(titleKey) ? titleKey : "errors.generic.title", values),
          description: i18n.exists(descriptionKey) ? t(descriptionKey, values) : undefined,
          testID: "xrp-delete-token-refusal",
        },
        primaryCta: {
          label: t("common.continue"),
          onPress: viewModel.onContinue,
          disabled: viewModel.isContinueDisabled,
          loading: viewModel.isContinueLoading,
          testID: "xrp-delete-token-continue",
        },
      };
    }
    case "broadcasting":
      return {
        preset: "text",
        title: t("send.newSendFlow.processingTransaction"),
        content: (
          <Box lx={{ alignItems: "center" }}>
            <Spinner size={32} />
          </Box>
        ),
        testID: "xrp-delete-token-broadcasting",
      };
    case "success":
      return {
        preset: "success",
        title: t("xrp.manageAssets.deleteSuccess.title", { ticker }),
        description: t("xrp.manageAssets.deleteSuccess.description"),
        primaryCta: { label: t("common.gotit"), onPress: viewModel.onSuccess },
        testID: "xrp-delete-token-success",
      };
    case "error":
      return {
        preset: "error",
        testID: "xrp-delete-token-error",
        title: t("xrp.manageAssets.deleteError.title"),
        description: <TranslatedError error={viewModel.deleteError} />,
        secondaryCta: { label: t("common.close"), onPress: viewModel.onClose },
        banner: viewModel.isSigned
          ? {
              appearance: "warning",
              description: t("xrp.manageAssets.deleteError.broadcastError"),
              testID: "xrp-delete-token-broadcast-error",
            }
          : undefined,
        primaryCta: {
          label: t("common.tryAgain"),
          onPress: viewModel.onRetry,
          testID: "xrp-delete-token-retry",
        },
      };
  }
}

export default function DeleteTokenSheets(props: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const viewModel = useDeleteTokenViewModel(props);
  const infoState = useInfoState(viewModel);
  const isBroadcasting = viewModel.infoStep === "broadcasting";

  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <>
      <QueuedBottomSheet
        isRequestingToBeOpened={viewModel.isInfoSheetOpen}
        onClose={viewModel.onInfoSheetClose}
        onModalHide={viewModel.onInfoSheetHidden}
        noCloseButton={isBroadcasting}
        preventBackdropClick={isBroadcasting}
        enableDynamicSizing
        maxDynamicContentSize={maxDynamicContentSize}
        contentHasBottomSpace
        testID="xrp-delete-token-sheet"
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <BottomSheetHeader />
          {viewModel.isInfoSheetOpen ? (
            <TrackScreen
              key={viewModel.infoStep}
              category="XrpManageTokenFlow"
              name={TRACK_NAMES[viewModel.infoStep]}
              type="drawer"
              refreshSource={false}
            />
          ) : null}
          {viewModel.infoStep === "success" ? (
            <SyncOneAccountOnMount
              reason="transaction-flow-confirmation"
              priority={10}
              accountId={props.account.id}
            />
          ) : null}
          <Box lx={{ paddingHorizontal: "s16" }}>
            <InfoState size="hug" {...infoState} />
          </Box>
        </BottomSheetScrollView>
      </QueuedBottomSheet>
      {viewModel.signing ? (
        <DeviceIntentExecutor
          enabled
          sourceFlow="manage_assets"
          analyticsProperties={viewModel.analyticsProperties}
          deviceConnectionParams={DEVICE_CONNECTION_PARAMS}
          deviceInitializationInput={viewModel.signing.deviceInitializationInput}
          intent={viewModel.signing.intent}
          intentComponentExtraProps={SIGNATURE_EXTRA_PROPS}
          onIntentJobStateChanged={viewModel.onIntentJobStateChanged}
          onIntentJobComplete={viewModel.onIntentJobComplete}
          onUserCancel={viewModel.onUserCancel}
        />
      ) : null}
    </>
  );
}
