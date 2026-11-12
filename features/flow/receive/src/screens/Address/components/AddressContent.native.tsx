import React from "react";
import { Banner, Box, Button, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { AddressSummary } from "./AddressSummary";
import { AddressSummarySkeleton } from "./AddressSummarySkeleton";
import { dimmedWhile } from "./dimmedWhile";
import { AddressActions } from "./AddressActions";
import { AddressVerifyHint as AddressVerifyHintView } from "./AddressVerifyHint";
import type { AddressVerifyHint, ReceiveAddressViewProps } from "../../../types";

const CHECKING_HEIGHT = 256;

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

function blockedAction(onPress?: () => void, label?: string, testId?: string) {
  return onPress && label ? (
    <Button appearance="gray" size="sm" onPress={onPress} testID={testId}>
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
      <Box
        lx={{ alignItems: "center", justifyContent: "center" }}
        style={{ height: CHECKING_HEIGHT }}
        testID="receive-address-checking"
      >
        <Spinner size={32} />
      </Box>
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
        testID="receive-address-blocked"
      />
    );
  }

  return (
    <>
      <Box {...dimmedWhile(!!verifyHint?.open)}>
        {status === "loading" ? (
          <AddressSummarySkeleton />
        ) : (
          <AddressSummary assetIcon={assetIcon} addressParts={addressParts} qrPayload={qrPayload} />
        )}
      </Box>
      <Box>
        {verifyHint ? <AddressVerifyHintView {...verifyHint} /> : null}
        <AddressActions
          visibleActions={visibleActions}
          hasCopied={hasCopied}
          isVerifyDisabled={isVerifyDisabled}
          onShare={onShare}
          onCopy={onCopy}
          onVerify={onVerify}
          disabled={status === "loading"}
          dimOtherActions={verifyHint?.open}
        />
      </Box>
    </>
  );
}
