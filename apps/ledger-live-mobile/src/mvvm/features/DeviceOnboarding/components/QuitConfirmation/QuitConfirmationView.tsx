import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { quitConfirmationTestIds } from "LLM/features/DeviceOnboarding/testIds";

export type QuitConfirmationViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  restart: string;
  leaveLabel: string;
  continueLabel: string;
  onLeave: () => void;
  onContinue: () => void;
}>;

type SheetAction = Readonly<{
  appearance: "base" | "gray";
  label: string;
  onPress: () => void;
  testID: string;
}>;

function SheetActionButton({ appearance, label, onPress, testID }: SheetAction) {
  return (
    <Button
      appearance={appearance}
      size="lg"
      lx={{ width: "full" }}
      testID={testID}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

function MutedLine({ children }: Readonly<{ children: string }>) {
  return (
    <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
      {children}
    </Text>
  );
}

export function QuitConfirmationView({
  isOpen,
  title,
  description,
  restart,
  leaveLabel,
  continueLabel,
  onLeave,
  onContinue,
}: QuitConfirmationViewProps) {
  const lines = [description, restart];
  const actions: SheetAction[] = [
    {
      appearance: "base",
      label: leaveLabel,
      onPress: onLeave,
      testID: quitConfirmationTestIds.leave,
    },
    {
      appearance: "gray",
      label: continueLabel,
      onPress: onContinue,
      testID: quitConfirmationTestIds.continue,
    },
  ];

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onContinue}
      enableDynamicSizing
      testID={quitConfirmationTestIds.sheet}
    >
      <BottomSheetView style={{ flex: 0 }}>
        <BottomSheetHeader />
        <Box
          lx={{
            alignItems: "center",
            gap: "s24",
            paddingHorizontal: "s16",
            paddingTop: "s8",
            width: "full",
          }}
        >
          <Spot appearance="muted" icon={InformationFill} size={72} />
          <Box lx={{ alignItems: "center", gap: "s12", width: "full" }}>
            <Text
              typography="heading4SemiBold"
              lx={{ color: "base", textAlign: "center", width: "full" }}
            >
              {title}
            </Text>
            <Box lx={{ alignItems: "center", gap: "s4", width: "full" }}>
              {lines.map(line => (
                <MutedLine key={line}>{line}</MutedLine>
              ))}
            </Box>
          </Box>
          <Box lx={{ gap: "s16", width: "full" }}>
            {actions.map(action => (
              <SheetActionButton key={action.testID} {...action} />
            ))}
          </Box>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
