import React, { useCallback, useEffect, useRef } from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { freezeConfirmActionKey, freezeConfirmTitleKey } from "./freezeConfirmCopy";
import type { FreezeConfirmSheetProps } from "../../types";

export function FreezeConfirmSheet({
  isOpen,
  isFrozen,
  isLoading,
  onConfirm,
  onClose,
}: FreezeConfirmSheetProps) {
  const { t } = useTranslation();
  const dismissed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    onClose();
  }, [onClose]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      testID="freeze-confirm-sheet"
    >
      {isOpen ? (
        <BottomSheetView testID="freeze-confirm-sheet-content">
          <BottomSheetHeader density="compact" spacing />
          <Box lx={{ alignItems: "center", gap: "s16", paddingHorizontal: "s16" }}>
            <Spot appearance="icon" icon={InformationFill} size={56} />
            <Box lx={{ alignItems: "center", gap: "s8" }}>
              <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {t(freezeConfirmTitleKey(isFrozen))}
              </Text>
              {!isFrozen ? (
                <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                  {t("payTab.card.freezeConfirm.description")}
                </Text>
              ) : null}
            </Box>
          </Box>
          <Box lx={{ gap: "s8", margin: "s16" }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              loading={isLoading}
              disabled={isLoading}
              onPress={onConfirm}
              testID="freeze-confirm-action"
            >
              {t(freezeConfirmActionKey(isFrozen))}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              isFull
              disabled={isLoading}
              onPress={handleClose}
              testID="freeze-confirm-cancel"
            >
              {t("payTab.card.goBack")}
            </Button>
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
