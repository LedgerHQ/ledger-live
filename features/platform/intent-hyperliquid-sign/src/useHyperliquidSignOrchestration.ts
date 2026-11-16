import { useCallback, useEffect, useRef, useState } from "react";
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
  appName: string | undefined;
  appOptions?: HyperliquidSignAppOptions;
  signOnSession: (
    session: HyperliquidSignSession,
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
  const { appName, appOptions, signOnSession, onSuccess, onError, onCancel } = request;
  const resolvedAppName = appName ?? HYPERLIQUID_APP_NAME;
  const requireLatestFirmware = appOptions?.requireLatestFirmware;
  const allowPartialDependencies = appOptions?.allowPartialDependencies;

  const [deviceInitializationInput, setDeviceInitializationInput] = useState<InitInput | null>(
    null,
  );
  const resultRef = useRef<HyperliquidSignIntentResult | null>(null);
  const isSettledRef = useRef(false);

  const settle = useCallback((answer: () => void) => {
    if (isSettledRef.current) return;
    isSettledRef.current = true;
    answer();
  }, []);

  useEffect(() => {
    let cancelled = false;

    buildDeviceInitializationInput({
      appRequest: {
        appName: resolvedAppName,
        requireLatestFirmware,
        allowPartialDependencies,
      },
    })
      .then(input => {
        if (!cancelled) setDeviceInitializationInput(input);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        settle(() => onError(normalizeError(error)));
        onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [
    resolvedAppName,
    requireLatestFirmware,
    allowPartialDependencies,
    buildDeviceInitializationInput,
    settle,
    onError,
    onClose,
  ]);

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => () => settle(() => onCancelRef.current()), [settle]);

  const [intent] = useState(() =>
    createIntent(
      platformDefinition,
      {
        signOnSession: async session => {
          const { signatures } = await signOnSession(session);
          return signatures;
        },
      },
      {
        onResult: result => {
          resultRef.current = result;
        },
      },
    ),
  );

  const onIntentJobComplete = useCallback(() => {
    const result = resultRef.current;
    if (!result) return;

    settle(() =>
      result.type === "signed"
        ? onSuccess({ signatures: result.signatures })
        : onError(result.error),
    );
    onClose();
  }, [settle, onSuccess, onError, onClose]);

  const onUserCancel = useCallback(() => {
    settle(onCancel);
    onClose();
  }, [settle, onCancel, onClose]);

  return {
    deviceInitializationInput,
    intent,
    onIntentJobComplete,
    onUserCancel,
  };
}
