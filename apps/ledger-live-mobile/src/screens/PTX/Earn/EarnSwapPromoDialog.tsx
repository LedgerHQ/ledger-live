import React, { useCallback, useRef } from "react";
import { BottomSheetView, BottomSheetHeader, Box, Button, Text, Spot } from "@ledgerhq/lumen-ui-rnative";
import { useSelector } from "~/context/hooks";
import { earnActionDialogSelector } from "~/reducers/earn";
import { resolveActionDialog } from "~/components/WebPTXPlayer/CustomHandlers";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

const SPOT_APPEARANCE = {
  info: "info",
  warning: "warning",
  success: "check",
} as const;

export function EarnSwapPromoDialog() {
  const dialog = useSelector(earnActionDialogSelector);

  const resolvedRef = useRef(false);
  const isRequestingToBeOpened = !!dialog;

  React.useEffect(() => {
    if (!dialog) {
      return;
    }

    resolvedRef.current = false;

    return () => {
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        resolveActionDialog(false);
      }
    };
  }, [dialog]);

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
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={false}
        onClose={handleClose}
        enableDynamicSizing
      >
        <BottomSheetView>
          <BottomSheetHeader />
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    );
  }

  const { title, description, ctaLabel, icon } = dialog;
  const spotAppearance = SPOT_APPEARANCE[icon ?? "info"] ?? "info";

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={handleClose}
      enableDynamicSizing
    >
      <BottomSheetView>
        <BottomSheetHeader />
        <Box lx={{ alignItems: "center", padding: "s16", paddingBottom: "s24", gap: "s24" }}>
          <Spot appearance={spotAppearance} size={72} />
          <Box lx={{ alignItems: "center", gap: "s8" }}>
            <Text
              typography="heading4SemiBold"
              lx={{ color: "base", textAlign: "center" }}
            >
              {title}
            </Text>
            <Text
              typography="body2"
              lx={{ color: "muted", textAlign: "center" }}
            >
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
    </QueuedDrawerBottomSheet>
  );
}
