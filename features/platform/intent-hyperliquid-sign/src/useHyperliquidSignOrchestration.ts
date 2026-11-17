import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
import { HYPERLIQUID_APP_NAME } from "./intentDefinition";
import type {
  HyperliquidSignature,
  HyperliquidSignIntent,
  HyperliquidSignIntentPlatformDefinition,
  HyperliquidSignIntentResult,
  HyperliquidSignSession,
} from "./types";

export type HyperliquidSignAppOptions = Readonly<{
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
}>;

export type HyperliquidSignAppRequest = Readonly<{
  appName: string;
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
}>;

export type HyperliquidSignOrchestrationRequest = Readonly<{
  appOptions?: HyperliquidSignAppOptions;
  signOnSession: (
    session: HyperliquidSignSession,
    signal: AbortSignal,
  ) => Promise<Readonly<{ signatures: HyperliquidSignature[] }>>;
  onSuccess: (result: { signatures: HyperliquidSignature[] }) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}>;

export type UseHyperliquidSignOrchestrationParams<InitInput, ExtraProps = undefined> = Readonly<{
  request: HyperliquidSignOrchestrationRequest;
  platformDefinition: HyperliquidSignIntentPlatformDefinition<ExtraProps>;
  buildDeviceInitializationInput: (params: {
    appRequest: HyperliquidSignAppRequest;
  }) => Promise<InitInput>;
  onClose: () => void;
}>;

export type HyperliquidSignOrchestration<InitInput, ExtraProps = undefined> = Readonly<{
  deviceInitializationInput: InitInput | null;
  intent: HyperliquidSignIntent<ExtraProps>;
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
}>;

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useHyperliquidSignOrchestration<InitInput, ExtraProps = undefined>({
  request,
  platformDefinition,
  buildDeviceInitializationInput,
  onClose,
}: UseHyperliquidSignOrchestrationParams<InitInput, ExtraProps>): HyperliquidSignOrchestration<
  InitInput,
  ExtraProps
> {
  const { appOptions, signOnSession, onSuccess, onError, onCancel } = request;
  const requireLatestFirmware = appOptions?.requireLatestFirmware;
  const allowPartialDependencies = appOptions?.allowPartialDependencies;

  const [deviceInitializationInput, setDeviceInitializationInput] = useState<InitInput | null>(
    null,
  );
  const isSettledRef = useRef(false);

  // A new deviceInitializationInput while the job runs is an executor invalidOperation, so the
  // callbacks are read through a ref instead of re-running the init effect on identity changes.
  const callbacksRef = useRef({
    onSuccess,
    onError,
    onCancel,
    onClose,
    buildDeviceInitializationInput,
  });
  useLayoutEffect(() => {
    callbacksRef.current = {
      onSuccess,
      onError,
      onCancel,
      onClose,
      buildDeviceInitializationInput,
    };
  });

  const settle = useCallback((answer: () => void) => {
    if (isSettledRef.current) return;
    isSettledRef.current = true;
    answer();
  }, []);

  useEffect(() => {
    let cancelled = false;

    callbacksRef.current
      .buildDeviceInitializationInput({
        appRequest: {
          appName: HYPERLIQUID_APP_NAME,
          requireLatestFirmware,
          allowPartialDependencies,
        },
      })
      .then(input => {
        if (!cancelled) setDeviceInitializationInput(input);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        settle(() => callbacksRef.current.onError(normalizeError(error)));
        callbacksRef.current.onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [requireLatestFirmware, allowPartialDependencies, settle]);

  useEffect(() => () => settle(() => callbacksRef.current.onCancel()), [settle]);

  const [{ intent, readResult }] = useState(() => {
    let lastResult: HyperliquidSignIntentResult | null = null;
    return {
      intent: createIntent(
        platformDefinition,
        {
          signOnSession: async (session, signal) => {
            const { signatures } = await signOnSession(session, signal);
            return signatures;
          },
        },
        {
          onResult: result => {
            lastResult = result;
          },
        },
      ),
      readResult: () => lastResult,
    };
  });

  const onIntentJobComplete = useCallback(() => {
    const result = readResult();
    if (!result) return;

    const { onSuccess: answerSuccess, onError: answerError, onClose: close } = callbacksRef.current;
    settle(() =>
      result.type === "signed"
        ? answerSuccess({ signatures: result.signatures })
        : answerError(result.error),
    );
    close();
  }, [settle, readResult]);

  const onUserCancel = useCallback(() => {
    settle(() => callbacksRef.current.onCancel());
    callbacksRef.current.onClose();
  }, [settle]);

  return {
    deviceInitializationInput,
    intent,
    onIntentJobComplete,
    onUserCancel,
  };
}
