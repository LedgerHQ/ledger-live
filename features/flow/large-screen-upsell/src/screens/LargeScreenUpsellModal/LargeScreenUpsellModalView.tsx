import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { LargeScreenUpsellModalContent } from "../../components/LargeScreenUpsellModalContent";
import type { LargeScreenUpsellModalViewModel } from "./types";

export function LargeScreenUpsellModalView({
  isOpen,
  imageSrc,
  title,
  subtitle,
  primaryButtonLabel,
  onDismiss,
  onCtaPress,
}: LargeScreenUpsellModalViewModel) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onDismiss("close button");
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] rounded-xl"
        data-testid="large-screen-upsell-modal"
        onPointerDownOutside={() => onDismiss("outside tap")}
        onEscapeKeyDown={() => onDismiss("escape key down")}
      >
        <DialogHeader density="expanded" onClose={() => onDismiss("close button")} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden">
          <LargeScreenUpsellModalContent
            imageSrc={imageSrc}
            title={title}
            subtitle={subtitle}
            primaryButtonLabel={primaryButtonLabel}
            onCtaPress={onCtaPress}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
