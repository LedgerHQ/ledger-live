import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AddressOptionList } from "./components/AddressOptionList";
import { AddressSummary } from "./components/AddressSummary";
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
  actions,
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
      <DialogContent
        // The network label describes the dialog once known; until then there is no description.
        {...(!networkLabel && { "aria-describedby": undefined })}
        data-testid="receive-address"
      >
        <DialogBackgroundToneProvider>
          {addressSelection ? (
            <>
              <DialogHeader
                density="expanded"
                title={addressSelection.title}
                onClose={closeDialog}
              />
              <DialogBody>
                <AddressOptionList
                  options={addressSelection.options}
                  onSelect={addressSelection.onSelect}
                />
              </DialogBody>
            </>
          ) : (
            <>
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
                    {isLoading || !address ? (
                      <AddressSummarySkeleton />
                    ) : (
                      <AddressSummary address={address} />
                    )}
                    <ZonePlaceholder
                      zone="actions"
                      label={[actions.copy, actions.share, actions.verify]
                        .map(action => action?.label)
                        .filter(Boolean)
                        .join(" · ")}
                    />
                    <ZonePlaceholder zone="notices" />
                  </>
                )}
                <ZonePlaceholder zone="extras" />
              </DialogBody>
            </>
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
