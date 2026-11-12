import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AddressContent } from "./components/AddressContent";
import { AddressOptionList } from "./components/AddressOptionList";
import { ReceiveAddressExtras } from "./components/ReceiveAddressExtras";
import { HelpPanel, MemoTagPanel } from "./components/ReceiveAddressPanels";
import { useReceiveAddressView } from "./useReceiveAddressView";
import type { ReceiveAddressViewProps } from "../../types";

export function ReceiveAddressView({
  title,
  networkLabel,
  assetIcon,
  status,
  blocked,
  selectAddressTitle,
  addressOptions,
  onSelectAddressOption,
  onBackToAddressSelection,
  addressParts,
  qrPayload,
  visibleActions,
  isVerifyDisabled,
  verificationUnavailableMessage,
  notices,
  memoTag,
  help,
  panel,
  verifyHint,
  onClose,
  onCopy,
  onShare,
  onVerify,
  onOpenPanel,
  onBackToAddress,
  onOpenHelpArticle,
  onLearnMoreMemoTag,
}: ReceiveAddressViewProps) {
  const { hasCopied, hint, handleOpenChange, handleCopy, handleInteractOutside } =
    useReceiveAddressView({
      isOpen: true,
      address: qrPayload,
      onClose,
      onCopy,
      verifyHint,
    });
  const closeDialog = () => handleOpenChange(false);

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        className="max-h-[90vh]"
        onPointerDownOutside={handleInteractOutside}
        onInteractOutside={handleInteractOutside}
      >
        {hint?.open ? (
          <div aria-hidden className="absolute inset-0 z-table-header bg-canvas-overlay" />
        ) : null}
        {panel === "selectAddress" ? (
          <>
            <DialogHeader density="expanded" title={selectAddressTitle} onClose={closeDialog} />
            <DialogBody>
              <AddressOptionList
                addressOptions={addressOptions}
                onSelectAddressOption={onSelectAddressOption}
              />
            </DialogBody>
          </>
        ) : panel === "address" ? (
          <>
            <DialogHeader
              density="compact"
              title={title}
              description={networkLabel}
              onBack={onBackToAddressSelection}
              onClose={closeDialog}
            />
            <DialogBody
              className={`relative flex flex-col gap-24 ${hint?.open ? "overflow-visible" : "overflow-y-auto"}`}
              data-testid="receive-address"
            >
              <AddressContent
                status={status}
                blocked={blocked}
                assetIcon={assetIcon}
                addressParts={addressParts}
                qrPayload={qrPayload}
                visibleActions={visibleActions}
                isVerifyDisabled={isVerifyDisabled}
                hasCopied={hasCopied}
                onShare={onShare}
                onCopy={handleCopy}
                onVerify={onVerify}
                verifyHint={hint}
              />
              <div className="flex flex-col gap-16">
                <ReceiveAddressExtras
                  notices={status === "ready" ? notices : []}
                  memoTag={memoTag}
                  help={help}
                  verificationUnavailableMessage={
                    status === "ready" ? verificationUnavailableMessage : undefined
                  }
                  onOpenPanel={onOpenPanel}
                />
              </div>
            </DialogBody>
          </>
        ) : (
          <DialogBackgroundToneProvider>
            <DialogHeader
              density={panel === "help" ? "expanded" : "compact"}
              title={panel === "help" ? help.title : undefined}
              onBack={onBackToAddress}
              onClose={closeDialog}
            />
            <DialogBody>
              {panel === "memoTag" && memoTag ? (
                <MemoTagPanel
                  memoTag={memoTag}
                  onBackToAddress={onBackToAddress}
                  onLearnMoreMemoTag={onLearnMoreMemoTag}
                />
              ) : (
                <HelpPanel help={help} onOpenHelpArticle={onOpenHelpArticle} />
              )}
            </DialogBody>
          </DialogBackgroundToneProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
