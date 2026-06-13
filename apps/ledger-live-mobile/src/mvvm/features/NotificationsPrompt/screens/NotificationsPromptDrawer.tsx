import React from "react";
import { BottomSheetView, Box, Button, Link } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { NotificationsDrawerIllustration } from "LLM/features/NotificationsPrompt/components/NotificationsDrawerIllustration";
import { NotificationsPromptContent } from "LLM/features/NotificationsPrompt/components/NotificationsPromptContent";
import { TrackScreen } from "~/analytics";
import { useNotificationsPromptDrawerViewModel } from "./useNotificationsPromptDrawerViewModel";

type NotificationsPromptDrawerViewProps = ReturnType<typeof useNotificationsPromptDrawerViewModel>;

const NotificationsPromptDrawerView = ({
  isOpen,
  promptTarget,
  title,
  description,
  allowLabel,
  laterLabel,
  onAllowNotificationsPress,
  onDelayLaterPress,
  onCloseFromBackdropPress,
  onModalHide,
  trackScreenProps,
}: NotificationsPromptDrawerViewProps) => {
  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      noCloseButton
      onBackdropPress={onCloseFromBackdropPress}
      onModalHide={onModalHide}
    >
      <TrackScreen {...trackScreenProps} />

      <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
        <Box lx={{ alignItems: "center" }}>
          <NotificationsDrawerIllustration promptTarget={promptTarget} />
          <NotificationsPromptContent title={title} description={description} />
        </Box>
        <Button
          appearance="base"
          size="lg"
          lx={{ width: "full", marginTop: "s32", marginBottom: "s24" }}
          onPress={onAllowNotificationsPress}
          testID="notifications-prompt-allow"
        >
          {allowLabel}
        </Button>
        <Box lx={{ alignItems: "center" }}>
          <Link
            appearance="base"
            underline={false}
            size="md"
            onPress={onDelayLaterPress}
            testID="notifications-prompt-later"
          >
            {laterLabel}
          </Link>
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
};

export const NotificationsPromptDrawer = () => {
  const viewModel = useNotificationsPromptDrawerViewModel();

  return <NotificationsPromptDrawerView {...viewModel} />;
};
