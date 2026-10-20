import React, { useCallback, useRef } from "react";
import {
  BottomSheetView,
  BottomSheetHeader,
  Box,
  Button,
  Text,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import {
  CheckmarkCircleFill,
  Download,
  InformationFill,
  WarningFill,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ActionDialogIcon } from "@ledgerhq/live-common/wallet-api/validation/actionDialogParams";
import { useSelector } from "~/context/hooks";
import { earnActionDialogSelector } from "~/reducers/earn";
import { resolveActionDialog } from "~/components/WebPTXPlayer/actionDialogStore";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

const SPOT_PROPS = {
  info: { appearance: "muted", icon: InformationFill },
  warning: { appearance: "warning", icon: WarningFill },
  success: { appearance: "success", icon: CheckmarkCircleFill },
} as const;

function ConfirmationSpot({ icon }: Readonly<{ icon: ActionDialogIcon }>) {
  const props = icon === "withdraw" ? { icon: Download } : SPOT_PROPS[icon];
  return <Spot {...props} size={72} />;
}

export function ActionConfirmationDialog() {
  const dialog = useSelector(earnActionDialogSelector);

  const activeDialogRef = useRef(dialog);
  const resolvedRef = useRef(false);
  const isRequestingToBeOpened = !!dialog;

  React.useEffect(() => {
    activeDialogRef.current = dialog;

    if (dialog) {
      resolvedRef.current = false;
    }
  }, [dialog]);

  React.useEffect(() => {
    return () => {
      if (activeDialogRef.current && !resolvedRef.current) {
        resolvedRef.current = true;
        resolveActionDialog(false);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      resolveActionDialog(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      resolveActionDialog(true);
    }
  }, []);

  if (!dialog) {
    return (
      <QueuedBottomSheet isRequestingToBeOpened={false} onClose={handleClose} enableDynamicSizing>
        <BottomSheetView>
          <BottomSheetHeader />
        </BottomSheetView>
      </QueuedBottomSheet>
    );
  }

  const { title, description, ctaLabel, icon } = dialog;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={handleClose}
      enableDynamicSizing
    >
      <BottomSheetView>
        <BottomSheetHeader />
        <Box lx={{ alignItems: "center", padding: "s16", paddingBottom: "s24", gap: "s24" }}>
          <ConfirmationSpot icon={icon ?? "info"} />
          <Box lx={{ alignItems: "center", gap: "s8" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {description}
            </Text>
          </Box>
          <Box lx={{ width: "full", gap: "s16" }}>
            <Button appearance="base" size="lg" onPress={handleConfirm} lx={{ width: "full" }}>
              {ctaLabel}
            </Button>
          </Box>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
