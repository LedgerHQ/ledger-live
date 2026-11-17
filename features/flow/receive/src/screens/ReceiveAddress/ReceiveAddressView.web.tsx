import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AddressActions } from "./components/AddressActions";
import { AddressOptionList } from "./components/AddressOptionList";
import { AddressSummary } from "./components/AddressSummary";
import { AddressSummarySkeleton } from "./components/AddressSummarySkeleton";
import { HelpPanel } from "./components/HelpPanel";
import { MemoPanel } from "./components/MemoPanel";
import { ReceiveAddressExtras } from "./components/ReceiveAddressExtras";
import { ReceiveAddressNotices } from "./components/ReceiveAddressNotices";
import { ServiceStatusPanel } from "./components/ServiceStatusPanel";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({
  title,
  networkLabel,
  isLoading,
  error,
  addressSelection,
  address,
  actions,
  notices,
  serviceWarning,
  serviceStatus,
  memoCard,
  memoPanel,
  helpCard,
  helpPanel,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  const isHintOpen = !!actions.verifyHint;
  // The close button, Escape and a click outside all leave through here, once the hint is answered.
  const handleOpenChange = (open: boolean) => {
    if (!open && !isHintOpen) onClose();
  };
  const keepOpenWhileHint = (event: Event) => {
    if (isHintOpen) event.preventDefault();
  };
  const closeDialog = () => handleOpenChange(false);

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        data-testid="receive-address"
        onPointerDownOutside={keepOpenWhileHint}
        onInteractOutside={keepOpenWhileHint}
      >
        {isHintOpen ? (
          // Everything but the hint and the tiles steps back while the hint is open.
          <div aria-hidden className="absolute inset-0 z-table-header bg-canvas-overlay" />
        ) : null}
        <DialogBackgroundToneProvider>
          {helpPanel ? (
            <>
              <DialogHeader
                density="expanded"
                title={helpPanel.title}
                onBack={helpPanel.onClose}
                onClose={closeDialog}
              />
              <DialogBody>
                <HelpPanel helpPanel={helpPanel} />
              </DialogBody>
            </>
          ) : memoPanel ? (
            <>
              <DialogHeader density="compact" onBack={memoPanel.onClose} onClose={closeDialog} />
              <DialogBody>
                <MemoPanel memoPanel={memoPanel} />
              </DialogBody>
            </>
          ) : serviceStatus ? (
            <>
              <DialogHeader
                density="expanded"
                title={serviceStatus.title}
                onBack={serviceStatus.onClose}
                onClose={closeDialog}
              />
              <DialogBody>
                <ServiceStatusPanel serviceStatus={serviceStatus} />
              </DialogBody>
            </>
          ) : addressSelection ? (
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
              <DialogBody
                className={`flex flex-col gap-24 ${isHintOpen ? "overflow-visible" : "overflow-y-auto"}`}
              >
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
                    <AddressActions actions={actions} />
                    <ReceiveAddressNotices notices={notices} serviceWarning={serviceWarning} />
                  </>
                )}
                <ReceiveAddressExtras memoCard={memoCard} helpCard={helpCard} />
              </DialogBody>
            </>
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
