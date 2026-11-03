import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

type MockServerActivationWarningProps = {
  isOpen: boolean;
  url: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function MockServerActivationWarning({
  isOpen,
  url,
  onConfirm,
  onClose,
}: Readonly<MockServerActivationWarningProps>) {
  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView>
        <BottomSheetHeader />
        <Box lx={{ alignItems: "center", padding: "s16", paddingBottom: "s24", gap: "s24" }}>
          <Spot appearance="error" icon={WarningFill} size={72} />
          <Box lx={{ alignItems: "center", gap: "s8" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
              Mock devices have no security
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              A mock server simulates Ledger devices. They are only meant for developers and
              testing.
            </Text>
            <Text typography="body2SemiBold" lx={{ color: "error", textAlign: "center" }}>
              Never use a real recovery phrase or real funds with a mock device.
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              Do not continue unless you know what you are doing.
            </Text>
          </Box>
          <Box lx={{ width: "full", gap: "s4" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              Server
            </Text>
            <Text typography="body2" lx={{ color: "base" }}>
              {url}
            </Text>
          </Box>
          <Box lx={{ width: "full", gap: "s8" }}>
            <Button appearance="red" size="lg" onPress={onConfirm} lx={{ width: "full" }}>
              I understand, restart
            </Button>
            <Button appearance="gray" size="lg" onPress={onClose} lx={{ width: "full" }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
