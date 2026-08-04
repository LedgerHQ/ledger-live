import React from "react";
import type { ComponentType } from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";

export type ContactConfirmationBottomSheetLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactConfirmationBottomSheetProps = Readonly<{
  isOpen: boolean;
  bottomInset?: number;
  icon: ComponentType;
  labels: ContactConfirmationBottomSheetLabels;
  confirmAppearance: "base" | "red";
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  confirmTestID?: string;
  onConfirm: () => void;
  onCancel: () => void;
}>;

export function ContactConfirmationBottomSheet({
  isOpen,
  bottomInset = 0,
  icon,
  labels,
  confirmAppearance,
  confirmLoading = false,
  confirmDisabled = false,
  confirmTestID,
  onConfirm,
  onCancel,
}: ContactConfirmationBottomSheetProps): React.JSX.Element {
  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
          <BottomSheetHeader />
          <Box lx={{ alignItems: "center", gap: "s16" }}>
            <Spot appearance="icon" icon={icon} size={56} />
            <Box lx={{ alignItems: "center", gap: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {labels.title}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {labels.description}
              </Text>
            </Box>
          </Box>
          <Box lx={{ gap: "s8" }}>
            <Button
              appearance={confirmAppearance}
              size="lg"
              isFull
              loading={confirmLoading}
              disabled={confirmDisabled}
              onPress={onConfirm}
              testID={confirmTestID}
            >
              {labels.confirm}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              isFull
              disabled={confirmLoading}
              onPress={onCancel}
            >
              {labels.cancel}
            </Button>
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
