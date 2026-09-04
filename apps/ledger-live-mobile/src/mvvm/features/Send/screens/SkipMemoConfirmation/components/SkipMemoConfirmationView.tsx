import React from "react";
import { Pressable } from "react-native";
import { BottomSheetHeader, Box, Button, Checkbox, Link, Text } from "@ledgerhq/lumen-ui-rnative";

type SkipMemoConfirmationViewProps = Readonly<{
  title: string;
  description: string;
  learnMoreLabel: string;
  doNotAskAgain: boolean;
  doNotAskAgainLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  onDoNotAskAgainChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onLearnMore: () => void;
}>;

export function SkipMemoConfirmationView({
  title,
  description,
  learnMoreLabel,
  doNotAskAgain,
  doNotAskAgainLabel,
  confirmLabel,
  cancelLabel,
  onDoNotAskAgainChange,
  onConfirm,
  onCancel,
  onLearnMore,
}: SkipMemoConfirmationViewProps) {
  return (
    <Box lx={{ gap: "s24" }}>
      <BottomSheetHeader density="expanded" title={title} />
      <Box lx={{ gap: "s16" }}>
        <Box lx={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "s4" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            {description}
          </Text>
          <Link appearance="accent" size="sm" onPress={onLearnMore}>
            {learnMoreLabel}
          </Link>
        </Box>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: doNotAskAgain }}
          onPress={() => onDoNotAskAgainChange(!doNotAskAgain)}
          testID="send-skip-memo-never-ask-again"
        >
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
            <Box pointerEvents="none">
              <Checkbox checked={doNotAskAgain} />
            </Box>
            <Text lx={{ color: "base" }}>{doNotAskAgainLabel}</Text>
          </Box>
        </Pressable>
      </Box>
      <Box lx={{ gap: "s12" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          testID="send-skip-memo-confirm"
          onPress={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          testID="send-skip-memo-cancel"
          onPress={onCancel}
        >
          {cancelLabel}
        </Button>
      </Box>
    </Box>
  );
}
