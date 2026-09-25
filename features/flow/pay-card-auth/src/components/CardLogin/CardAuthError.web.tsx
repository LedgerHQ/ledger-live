import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";
import type { CardAuthErrorProps } from "./types";

export function CardAuthError({ error }: CardAuthErrorProps) {
  if (!error) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) error.onDismiss();
  };

  return (
    <Dialog open height="fit" onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} data-testid="card-auth-error-dialog">
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" onClose={error.onDismiss} />
          <DialogBody>
            <InfoState
              preset="error"
              size="hug"
              title={error.title}
              description={error.description}
              primaryCta={{
                label: error.ctaLabel,
                onPress: error.onRetry,
                testID: "card-auth-error-cta",
              }}
              testID="card-auth-error"
            />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
