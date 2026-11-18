import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
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
  success: "DeleteSuccess",
  error: "DeleteError",
};

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

function noop() {}

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
      const description = t("xrp.manageAssets.deleteConfirm.description", {
        accountName: viewModel.accountName,
      });

      const isIou = viewModel.token.tokenType === "iou";
      const statusError = viewModel.statusError;
      const values = statusError && { ...statusError, message: statusError.message };
      const titleKey = `errors.${statusError?.name}.title`;
      const descriptionKey = `errors.${statusError?.name}.description`;

      return {
        preset: "info",
        testID: "xrp-delete-token-confirm",
        title: t("xrp.manageAssets.deleteConfirm.title", { ticker }),
        description: isIou
          ? `${description} ${t("xrp.manageAssets.deleteConfirm.limitZero")}`
          : description,
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
  const { bottom: bottomInset } = useSafeAreaInsets();
  const viewModel = useDeleteTokenViewModel(props);
  const infoState = useInfoState(viewModel);

  return (
    <>
      <QueuedBottomSheet
        isRequestingToBeOpened={viewModel.isInfoSheetOpen}
        onClose={viewModel.onInfoSheetClose}
        onModalHide={viewModel.onInfoSheetHidden}
        enableDynamicSizing
        contentHasBottomSpace
        testID="xrp-delete-token-sheet"
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader />
          {viewModel.isInfoSheetOpen ? (
            <TrackScreen
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
        </BottomSheetView>
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
          onExecutorStateChanged={noop}
          onIntentJobStateChanged={viewModel.onIntentJobStateChanged}
          onIntentJobComplete={noop}
          onIntentJobError={noop}
          cancelIntentRequestId={undefined}
          onUserCancel={viewModel.onUserCancel}
        />
      ) : null}
    </>
  );
}
