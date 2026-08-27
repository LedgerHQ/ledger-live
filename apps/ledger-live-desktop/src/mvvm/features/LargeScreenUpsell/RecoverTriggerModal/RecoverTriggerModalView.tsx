import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";
import { RECOVER_TRIGGER_DISMISS_BUTTON } from "./analytics";
import type { RecoverTriggerModalViewProps } from "./useRecoverTriggerModalViewModel";

export function RecoverTriggerModalView({
  title,
  description,
  ctaLabel,
  dismissLabel,
  onDismiss,
  onCtaPress,
}: RecoverTriggerModalViewProps) {
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onDismiss(RECOVER_TRIGGER_DISMISS_BUTTON.closeButton);
      }}
      height="fit"
    >
      <DialogContent
        aria-describedby={undefined}
        className="w-[400px] bg-base p-0"
        onPointerDownOutside={() => onDismiss(RECOVER_TRIGGER_DISMISS_BUTTON.outsideTap)}
      >
        <DialogBackgroundToneProvider>
          <DialogHeader
            density="compact"
            onClose={() => onDismiss(RECOVER_TRIGGER_DISMISS_BUTTON.closeButton)}
            className="!mb-0"
          />
          <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">
            <InfoState
              preset="error"
              size="hug"
              title={title}
              description={description}
              primaryCta={{ label: ctaLabel, onPress: onCtaPress }}
              secondaryCta={{
                label: dismissLabel,
                onPress: () => onDismiss(RECOVER_TRIGGER_DISMISS_BUTTON.notNow),
              }}
            />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
