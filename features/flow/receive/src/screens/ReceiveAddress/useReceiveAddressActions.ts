import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { useVerifyAddressFlow } from "../../hooks/useVerifyAddressFlow";
import { canVerifyOnDevice } from "../../logic/canVerifyOnDevice";
import type { ReceiveAddressOption } from "../../logic/toReceiveAddressOptions";
import { markReceiveVerifyHintSeen, selectHasSeenReceiveVerifyHint } from "../../state";
import type { ReceiveFamilyConfig, VerifyAddressOutcome } from "../../types";
import { trackReceiveAddressButton, type ReceiveAddressTracking } from "./receiveAddressTracking";
import type { ReceiveAddressActionsView } from "./ReceiveAddressView.types";

const COPIED_FEEDBACK_MS = 3000;

type Params = Readonly<{
  accountUUID: AccountUUID;
  assetId: CryptoOrTokenCurrencyId;
  /** Absent until the address is shown. */
  selected: ReceiveAddressOption | undefined;
  familyConfig: ReceiveFamilyConfig;
  copy: ReceiveAddressCopy;
  hasVerifyExecutor: boolean;
  tracking: ReceiveAddressTracking;
  onCopyAddress?: (address: string) => Promise<boolean>;
  onShareAddress?: (address: string) => void;
  onClose: () => void;
}>;

export type ReceiveAddressActions = Readonly<{
  actions: ReceiveAddressActionsView;
  /** The device confirmed the address shown. */
  isVerified: boolean;
  /** The device verification to mount, while one runs. */
  verification: UseVerifyAddressExecutorViewModelParams | undefined;
}>;

/**
 * Copy, Share and Verify for the address shown. Verify is disabled when the device cannot show
 * that address, and invites the user once with a hint, until they verify or dismiss it.
 */
export function useReceiveAddressActions({
  accountUUID,
  assetId,
  selected,
  familyConfig,
  copy,
  hasVerifyExecutor,
  tracking,
  onCopyAddress,
  onShareAddress,
  onClose,
}: Params): ReceiveAddressActions {
  const dispatch = useDispatch();
  const hasSeenVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const verifyFlow = useVerifyAddressFlow({ onCloseFlow: onClose });
  const [copiedAddress, setCopiedAddress] = useState<string>();
  const [copyButtonPresses, setCopyButtonPresses] = useState(0);
  const [verifiedAddress, setVerifiedAddress] = useState<string>();

  const address = selected?.address;
  const verification = selected?.verification;
  const canVerify = canVerifyOnDevice(verification);

  useEffect(() => {
    if (!copiedAddress) return;
    const timeout = setTimeout(() => setCopiedAddress(undefined), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [copiedAddress]);

  const copyAddress = useCallback(async () => {
    if (!address || !onCopyAddress) return;
    trackReceiveAddressButton("copy address", tracking);
    if (await onCopyAddress(address)) setCopiedAddress(address);
  }, [address, onCopyAddress, tracking]);

  const copyFromButton = useCallback(async () => {
    setCopyButtonPresses(presses => presses + 1);
    await copyAddress();
  }, [copyAddress]);

  const shareAddress = useCallback(() => {
    if (!address || !onShareAddress) return;
    trackReceiveAddressButton("share address", tracking);
    onShareAddress(address);
  }, [address, onShareAddress, tracking]);

  const verifyAddress = useCallback(() => {
    if (!canVerifyOnDevice(verification)) return;
    trackReceiveAddressButton("verify address", tracking);
    dispatch(markReceiveVerifyHintSeen());
    verifyFlow.start({ accountUUID, assetId, verification });
  }, [verification, dispatch, verifyFlow, accountUUID, assetId, tracking]);

  const dismissVerifyHint = useCallback(() => {
    trackReceiveAddressButton("dismiss verify popover", tracking);
    dispatch(markReceiveVerifyHintSeen());
  }, [dispatch, tracking]);

  const isShown = address !== undefined;
  const onVerifyExit = verifyFlow.onExit;
  const verifiedSelection = verifyFlow.selection;
  const exitVerification = useCallback(
    (outcome: VerifyAddressOutcome) => {
      const verified = verifiedSelection?.verification;
      if (outcome === "verified" && canVerifyOnDevice(verified))
        setVerifiedAddress(verified.address);
      onVerifyExit(outcome);
    },
    [onVerifyExit, verifiedSelection],
  );

  return {
    isVerified: canVerify && verification.address === verifiedAddress,
    actions: {
      disabled: !isShown,
      copy: onCopyAddress
        ? {
            label: address && copiedAddress === address ? copy.copiedLabel : copy.copyLabel,
            hasCopied: !!address && copiedAddress === address,
            onPress: copyFromButton,
            onPressCode: copyAddress,
            buttonPresses: copyButtonPresses,
          }
        : undefined,
      share: onShareAddress ? { label: copy.shareLabel, onPress: shareAddress } : undefined,
      verify: hasVerifyExecutor
        ? { label: copy.verifyLabel, disabled: !canVerify, onPress: verifyAddress }
        : undefined,
      verifyHint:
        hasVerifyExecutor && isShown && canVerify && !hasSeenVerifyHint && !verifyFlow.active
          ? {
              message: copy.verifyHintMessage,
              gotItLabel: copy.verifyHintGotIt,
              onGotIt: dismissVerifyHint,
            }
          : undefined,
    },
    verification:
      verifyFlow.selection === null
        ? undefined
        : {
            selection: verifyFlow.selection,
            onExit: exitVerification,
            unsupportedDeviceModelIds: familyConfig.unsupportedDeviceModelIds,
          },
  };
}
