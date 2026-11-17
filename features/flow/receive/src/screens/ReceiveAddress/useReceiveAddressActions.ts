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
import type { ReceiveFamilyConfig } from "../../types";
import { trackReceiveAddressButton } from "./receiveAddressTracking";
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
  onCopyAddress?: (address: string) => Promise<boolean>;
  onShareAddress?: (address: string) => void;
  onClose: () => void;
}>;

export type ReceiveAddressActions = Readonly<{
  actions: ReceiveAddressActionsView;
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
  onCopyAddress,
  onShareAddress,
  onClose,
}: Params): ReceiveAddressActions {
  const dispatch = useDispatch();
  const hasSeenVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const verifyFlow = useVerifyAddressFlow({ onCloseFlow: onClose });
  const [copiedAddress, setCopiedAddress] = useState<string>();
  const [copyButtonPresses, setCopyButtonPresses] = useState(0);

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
    trackReceiveAddressButton("copy address");
    if (await onCopyAddress(address)) setCopiedAddress(address);
  }, [address, onCopyAddress]);

  const copyFromButton = useCallback(async () => {
    setCopyButtonPresses(presses => presses + 1);
    await copyAddress();
  }, [copyAddress]);

  const shareAddress = useCallback(() => {
    if (!address || !onShareAddress) return;
    trackReceiveAddressButton("share address");
    onShareAddress(address);
  }, [address, onShareAddress]);

  const verifyAddress = useCallback(() => {
    if (!canVerifyOnDevice(verification)) return;
    trackReceiveAddressButton("verify address");
    dispatch(markReceiveVerifyHintSeen());
    verifyFlow.start({ accountUUID, assetId, verification });
  }, [verification, dispatch, verifyFlow, accountUUID, assetId]);

  const dismissVerifyHint = useCallback(() => {
    trackReceiveAddressButton("dismiss verify popover");
    dispatch(markReceiveVerifyHintSeen());
  }, [dispatch]);

  const isShown = address !== undefined;

  return {
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
            onExit: verifyFlow.onExit,
            unsupportedDeviceModelIds: familyConfig.unsupportedDeviceModelIds,
          },
  };
}
