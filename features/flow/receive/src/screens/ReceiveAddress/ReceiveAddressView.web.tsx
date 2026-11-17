import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AddressSummarySkeleton } from "./components/AddressSummarySkeleton";
import { ZonePlaceholder } from "./components/ZonePlaceholder";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({
  title,
  networkLabel,
  isLoading,
  error,
  addressSelection,
  address,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  // The close button, Escape and a click outside all leave through here.
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const closeDialog = () => handleOpenChange(false);

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} data-testid="receive-address">
        <DialogBackgroundToneProvider>
          <DialogHeader
            density="compact"
            title={title}
            description={networkLabel}
            onBack={onBack}
            onClose={closeDialog}
          />
          <DialogBody className="flex flex-col gap-24">
            {error ? (
              <InfoState
                preset="error"
                size="hug"
                title={error.title}
                description={error.description}
                primaryCta={{
                  label: error.retryLabel,
                  onPress: error.onRetry,
                  testID: "receive-address-retry",
                }}
                testID="receive-address-error"
              />
            ) : (
              <>
                {isLoading ? (
                  <AddressSummarySkeleton />
                ) : (
                  <>
                    <ZonePlaceholder zone="summary" label={address?.value} />
                    <ZonePlaceholder
                      zone="address"
                      label={addressSelection?.title ?? address?.label}
                    />
                  </>
                )}
                <ZonePlaceholder zone="actions" />
                <ZonePlaceholder zone="notices" />
              </>
            )}
            <ZonePlaceholder zone="extras" />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
