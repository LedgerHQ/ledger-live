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
  onClose,
  onCtaPress,
}: LargeScreenUpsellModalViewModel) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90vh] rounded-xl"
        data-testid="large-screen-upsell-modal"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader density="expanded" onClose={onClose} />
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
