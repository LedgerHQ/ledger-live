import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { InformationFill, WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import type { ConfirmBodyProps } from "../../../types";

const SPOT_ICON = {
  error: WarningFill,
  info: InformationFill,
} as const;

export function ConfirmBody({
  appearance,
  titleKey,
  descriptionKey,
  descriptionTestID,
  confirmLabelKey,
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmBodyProps) {
  const { t } = useTranslation();

  useBottomSheetBackgroundTone(appearance);

  return (
    <>
      <Box lx={{ alignItems: "center", gap: "s16", paddingHorizontal: "s16" }}>
        <Spot appearance="icon" icon={SPOT_ICON[appearance]} size={56} />
        <Box lx={{ alignItems: "center", gap: "s8" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {t(titleKey)}
          </Text>
          {descriptionKey ? (
            <Text
              typography="body2"
              lx={{ color: "muted", textAlign: "center" }}
              testID={descriptionTestID}
            >
              {t(descriptionKey)}
            </Text>
          ) : null}
        </Box>
      </Box>
      <Box lx={{ gap: "s8", margin: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          loading={isPending}
          disabled={isPending}
          onPress={onConfirm}
          testID="freeze-confirm-action"
        >
          {t(confirmLabelKey)}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          disabled={isPending}
          onPress={onClose}
          testID="freeze-confirm-cancel"
        >
          {t("payTab.card.goBack")}
        </Button>
      </Box>
    </>
  );
}
