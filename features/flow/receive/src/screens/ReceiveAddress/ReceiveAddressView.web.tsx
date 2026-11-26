import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AddressActions } from "./components/AddressActions";
import { AddressOptionList } from "./components/AddressOptionList";
import { AddressSummary } from "./components/AddressSummary";
import { AddressSummarySkeleton } from "./components/AddressSummarySkeleton";
import { HelpPanel } from "./components/HelpPanel";
import { MemoPanel } from "./components/MemoPanel";
import { ReceiveAddressExtras } from "./components/ReceiveAddressExtras";
import { ReceiveAddressNotices } from "./components/ReceiveAddressNotices";
import { ReceiveAddressUnavailable } from "./components/ReceiveAddressUnavailable";
import { ServiceStatusPanel } from "./components/ServiceStatusPanel";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({
  title,
  networkLabel,
  isLoading,
  error,
  gate,
  addressSelection,
  address,
  actions,
  isVerifying,
  notices,
  serviceStatus,
  helpCard,
  helpPanel,
  memoCard,
  memoPanel,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  const isHintOpen = !!actions.verifyHint;
  const isUnavailable = !!error || !!gate;
  // The close button, Escape and a click outside all leave through here, once the hint is answered.
  const handleOpenChange = (open: boolean) => {
    if (!open && !isHintOpen) onClose();
  };
  const keepOpenWhileHint = (event: Event) => {
    if (isHintOpen) event.preventDefault();
  };
  const closeDialog = () => handleOpenChange(false);
  const incidentContent = serviceStatus && (
    <>
      <DialogHeader density="compact" onClose={closeDialog} />
      <DialogBody>
        <ServiceStatusPanel serviceStatus={serviceStatus} />
      </DialogBody>
    </>
  );
  const memoContent = memoPanel && (
    <>
      <DialogHeader density="compact" onBack={memoPanel.onClose} onClose={closeDialog} />
      <DialogBody>
        <MemoPanel memoPanel={memoPanel} />
      </DialogBody>
    </>
  );
  const helpContent = helpPanel && (
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
  );

  return (
    <Dialog open={!isVerifying} onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        // The network label describes the dialog once known; until then there is no description.
        {...(!networkLabel && { "aria-describedby": undefined })}
        {...(serviceStatus && { "aria-label": serviceStatus.title })}
        data-testid="receive-address"
        onPointerDownOutside={keepOpenWhileHint}
        onInteractOutside={keepOpenWhileHint}
      >
        {isHintOpen ? (
          // Everything but the hint and the tiles steps back while the hint is open.
          <div aria-hidden className="absolute inset-0 z-table-header bg-canvas-overlay" />
        ) : null}
        <DialogBackgroundToneProvider>
          {incidentContent ??
            memoContent ??
            helpContent ??
            (addressSelection ? (
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
                  <ReceiveAddressUnavailable error={error} gate={gate} />
                  {isUnavailable ? null : (
                    <>
                      {isLoading || !address ? (
                        <AddressSummarySkeleton />
                      ) : (
                        <AddressSummary
                          address={address}
                          onCopy={actions.copy?.onPressCode}
                          copyLabel={actions.copy?.label}
                          copyKey={actions.copy?.buttonPresses}
                        />
                      )}
                      <AddressActions actions={actions} />
                      <ReceiveAddressNotices notices={notices} />
                    </>
                  )}
                  <ReceiveAddressExtras memoCard={memoCard} helpCard={helpCard} />
                </DialogBody>
              </>
            ))}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
