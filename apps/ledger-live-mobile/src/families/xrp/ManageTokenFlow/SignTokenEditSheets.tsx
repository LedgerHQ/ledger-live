import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView, Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState, type InfoStateProps } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";
import { type InfoStep, SIGNATURE_EXTRA_PROPS, type useSignTokenEdit } from "./useSignTokenEdit";

type ViewModel = ReturnType<typeof useSignTokenEdit>;

type Props = Readonly<{ viewModel: ViewModel }>;

const TRACK_NAMES: Record<InfoStep, string> = {
  broadcasting: "EditBroadcasting",
  success: "EditSuccess",
  error: "EditError",
};

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

function useInfoState(viewModel: ViewModel): InfoStateProps {
  const { t } = useTranslation();
  const closeCta = { label: t("common.close"), onPress: viewModel.onClose };

  switch (viewModel.infoStep) {
    case "broadcasting":
      return {
        preset: "text",
        title: t("send.newSendFlow.processingTransaction"),
        testID: "xrp-edit-token-broadcasting",
        content: (
          <Box lx={{ alignItems: "center" }}>
            <Spinner size={32} />
          </Box>
        ),
      };
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
        description: <TranslatedError error={viewModel.editError} />,
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
  const viewModel = props.viewModel;
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const infoState = useInfoState(viewModel);

  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <>
      <QueuedBottomSheet
        isRequestingToBeOpened={viewModel.isInfoSheetOpen}
        onClose={viewModel.onInfoSheetClose}
        onModalHide={viewModel.onInfoSheetHidden}
        noCloseButton={viewModel.isBroadcasting}
        preventBackdropClick={viewModel.isBroadcasting}
        enableDynamicSizing
        maxDynamicContentSize={maxDynamicContentSize}
        contentHasBottomSpace
        testID="xrp-edit-token-sheet"
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
