import React from "react";
import { Banner, Button, Spinner } from "@ledgerhq/lumen-ui-react";
import { AddressSummary } from "./AddressSummary";
import { AddressSummarySkeleton } from "./AddressSummarySkeleton";
import { AddressActions } from "./AddressActions";
import type { AddressVerifyHint, ReceiveAddressViewProps } from "../../../types";

type Props = Pick<
  ReceiveAddressViewProps,
  | "status"
  | "blocked"
  | "assetIcon"
  | "addressParts"
  | "qrPayload"
  | "visibleActions"
  | "isVerifyDisabled"
  | "onShare"
  | "onVerify"
> &
  Readonly<{ hasCopied: boolean; onCopy: () => void; verifyHint?: AddressVerifyHint }>;

function blockedAction(onClick?: () => void, label?: string, testId?: string) {
  return onClick && label ? (
    <Button appearance="gray" size="sm" onClick={onClick} data-testid={testId}>
      {label}
    </Button>
  ) : undefined;
}

/** QR, address and actions, their skeletons while loading, or the checking / blocked state. */
export function AddressContent({
  status,
  blocked,
  assetIcon,
  addressParts,
  qrPayload,
  visibleActions,
  isVerifyDisabled,
  hasCopied,
  onShare,
  onCopy,
  onVerify,
  verifyHint,
}: Props) {
  if (status === "checking") {
    return (
      <div
        className="flex h-256 items-center justify-center"
        data-testid="receive-address-checking"
      >
        <Spinner size={32} />
      </div>
    );
  }

  if (status === "blocked" && blocked) {
    // At most two actions: the step the user can take first, then the hand-over to the legacy flow.
    const actions = [
      blockedAction(blocked.onActivate, blocked.activateLabel, "receive-address-activate"),
      blockedAction(blocked.onRetry, blocked.retryLabel, "receive-address-retry"),
      blockedAction(blocked.onUseLegacyFlow, blocked.legacyFlowLabel, "receive-address-legacy"),
    ].filter(Boolean);
    return (
      <Banner
        appearance={blocked.appearance}
        title={blocked.title}
        description={blocked.description}
        primaryAction={actions[0]}
        secondaryAction={actions[1]}
        data-testid="receive-address-blocked"
      />
    );
  }

  return (
    <>
      {status === "loading" ? (
        <AddressSummarySkeleton />
      ) : (
        <AddressSummary assetIcon={assetIcon} addressParts={addressParts} qrPayload={qrPayload} />
      )}
      <AddressActions
        visibleActions={visibleActions}
        hasCopied={hasCopied}
        isVerifyDisabled={isVerifyDisabled}
        onShare={onShare}
        onCopy={onCopy}
        onVerify={onVerify}
        disabled={status === "loading"}
        verifyHint={verifyHint}
      />
    </>
  );
}
