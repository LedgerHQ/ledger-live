import { useCallback, useMemo, useRef, useState } from "react";
import { createIntent, type Intent } from "@features/platform-device-intent";
import { track } from "@shared/analytics";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { presentBroadcastError } from "@ledgerhq/live-common/flows/send/presentBroadcastError";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type {
  SignTransactionIntentInput,
  SignTransactionIntentWithResultJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import { updateAccountWithUpdater } from "~/actions/accounts";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { broadcastLogger } from "~/datadog";
import { tokenSignatureIntentLWMDefinition } from "../components/TokenSignatureIntent/intentLWMDefinition";
import { applyTrustLineEdit } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type InfoStep = "broadcasting" | "success" | "error";

type Step = InfoStep | "idle" | "sign" | "closed";

type Signing = Readonly<{
  intent: Intent<
    SignTransactionIntentWithResultJobState,
    SignTransactionIntentInput,
    SignatureExtraProps,
    SignedOperation
  >;
  deviceInitializationInput: InitializationInput;
}>;

type Failure = Readonly<{ error: Error; isSigned: boolean }>;

type Navigation = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>["navigation"];

type Props = Readonly<{
  navigation: Navigation;
  parentAccount: Account;
  tokenAccount: XrpTokenAccount;
  transaction: Transaction | null | undefined;
}>;

const INFO_STEPS = new Set<Step>(["broadcasting", "success", "error"]);

const BROADCAST_CONFIG = {
  mevProtected: false,
  source: { type: "coin-module", name: "ledger-live-mobile" },
} as const;

export const SIGNATURE_EXTRA_PROPS: SignatureExtraProps = { sponsoredTransfer: false };

function isInfoStep(step: Step): step is InfoStep {
  return INFO_STEPS.has(step);
}

function toError(rejection: unknown): Error {
  return rejection instanceof Error ? rejection : new Error(String(rejection));
}

export function useSignTokenEdit(props: Props) {
  const { navigation, parentAccount, tokenAccount, transaction } = props;

  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>("idle");
  // Sheet callbacks can fire back to back before a re-render, so they read the step from here
  const stepRef = useRef<Step>("idle");
  // The sheet keeps showing its last content while it animates out
  const [infoStep, setInfoStep] = useState<InfoStep>("broadcasting");
  const [failure, setFailure] = useState<Failure>();
  const [signing, setSigning] = useState<Signing>();
  const signedOperationRef = useRef<SignedOperation | undefined>(undefined);
  const operationRef = useRef<Operation | undefined>(undefined);
  const exitToDetailsRef = useRef(false);

  const broadcast = useBroadcast({
    account: parentAccount,
    transaction,
    broadcastConfig: BROADCAST_CONFIG,
    logger: broadcastLogger,
  });

  const goTo = useCallback((next: Step) => {
    stepRef.current = next;
    setStep(next);
    if (isInfoStep(next)) setInfoStep(next);
  }, []);

  const showError = useCallback(
    (next: Failure) => {
      setSigning(undefined);
      setFailure(next);
      goTo("error");
    },
    [goTo],
  );

  const onSign = useCallback(() => {
    if (!transaction || stepRef.current === "sign") return;

    goTo("sign");

    buildDeviceInitializationInput({
      appRequest: { account: parentAccount },
      flow: FlowName.manageAssets,
    })
      .then(deviceInitializationInput => {
        const input: SignTransactionIntentInput = {
          account: parentAccount,
          transaction,
          parentAccount: null,
        };
        const intent = createIntent(tokenSignatureIntentLWMDefinition, input, {
          onResult: signedOperation => {
            signedOperationRef.current = signedOperation;
          },
        });
        setSigning({ intent, deviceInitializationInput });
      })
      .catch(error => showError({ error: toError(error), isSigned: false }));
  }, [goTo, parentAccount, showError, transaction]);

  // Broadcasting unmounts the executor, so it waits for the job to end, as the executor requires.
  // Once idle, a mounted executor would let a disconnect retry and sign the edit again.
  const onIntentJobComplete = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation || !transaction) return;

    signedOperationRef.current = undefined;
    goTo("broadcasting");
    broadcast(signedOperation)
      .then(operation => {
        operationRef.current = operation;

        // A sync right now would read the ledger before it validates the edit: show the signed values instead
        const edit = { limit: transaction.amount, isRippling: !transaction.noRipple };
        dispatch(
          updateAccountWithUpdater({
            accountId: parentAccount.id,
            updater: current => {
              return applyTrustLineEdit(
                addPendingOperation(current, operation),
                tokenAccount.id,
                edit,
              );
            },
          }),
        );

        goTo("success");
      })
      .catch(error => {
        showError({ error: presentBroadcastError(error, parentAccount, null), isSigned: true });
      });
  }, [broadcast, dispatch, goTo, parentAccount, showError, tokenAccount.id, transaction]);

  const onClose = useCallback(() => goTo("closed"), [goTo]);

  const onViewDetails = useCallback(() => {
    exitToDetailsRef.current = true;
    goTo("closed");
  }, [goTo]);

  // A sheet also reports a close when the flow moves on to the next sheet
  const onInfoSheetClose = useCallback(() => {
    if (isInfoStep(stepRef.current)) goTo("closed");
  }, [goTo]);

  const onInfoSheetHidden = useCallback(() => {
    const operation = operationRef.current;
    if (stepRef.current !== "closed" || !operation) return;

    operationRef.current = undefined;
    navigation.popTo(ScreenName.XrpManageTokenList, { accountId: parentAccount.id });
    if (exitToDetailsRef.current) {
      exitToDetailsRef.current = false;
      navigation.navigate(ScreenName.OperationDetails, {
        accountId: parentAccount.id,
        operation,
      });
    }
  }, [navigation, parentAccount.id]);

  // The executor sheet cancels on close and on unmount, with the props of its last render.
  // Once signed, only the broadcast result ends the step.
  const onUserCancel = useCallback(() => {
    if (stepRef.current !== "sign") return;

    setSigning(undefined);
    goTo("idle");
  }, [goTo]);

  const analyticsProperties = useMemo(() => {
    return {
      action: "edit",
      currency: parentAccount.currency.id,
      tokenType: tokenAccount.token.tokenType,
    };
  }, [parentAccount.currency.id, tokenAccount.token.tokenType]);

  const onIntentJobStateChanged = useCallback(
    (jobState: SignTransactionIntentWithResultJobState) => {
      if (jobState.type !== "error") return;

      track("error_displayed", {
        ...analyticsProperties,
        step: "signature",
        message_id: jobState.error.name,
        message_type: "error",
      });
    },
    [analyticsProperties],
  );

  return {
    analyticsProperties,
    infoStep,
    onSign,
    onClose,
    onViewDetails,
    onInfoSheetClose,
    onInfoSheetHidden,
    onIntentJobComplete,
    onIntentJobStateChanged,
    onUserCancel,
    editError: failure?.error,
    isSigned: !!failure?.isSigned,
    isSigning: step === "sign",
    isBroadcasting: step === "broadcasting",
    isInfoSheetOpen: isInfoStep(step),
    signing: step === "sign" ? signing : undefined,
  };
}
