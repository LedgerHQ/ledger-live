import { useCallback, useEffect, useRef, useState } from "react";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { createIntent } from "@features/platform-device-intent";
import {
  HYPERLIQUID_APP_NAME,
  type HyperliquidSignIntentResult,
} from "@features/platform-hyperliquid-sign-intent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { buildHyperliquidSignIntentInput } from "../../deviceIntents/hyperliquidSignIntent/buildHyperliquidSignIntentInput";
import { hyperliquidSignIntentLWMDefinition } from "../../deviceIntents/hyperliquidSignIntent/intentLWMDefinition";

type Props = Readonly<{
  request: PerpsSignRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
}>;

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function usePerpsSignDrawerViewModel({ request, onClose }: Props) {
  const { appOptions, signOnSession, onSuccess, onError } = request;
  const requireLatestFirmware = appOptions?.requireLatestFirmware;
  const allowPartialDependencies = appOptions?.allowPartialDependencies;

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
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
        settle(() => onError(normalizeError(error)));
        onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [requireLatestFirmware, allowPartialDependencies, settle, onError, onClose]);

  // Leaving the live app, or a newer request replacing this one, must not leave it pending.
  useEffect(() => () => settle(() => onError(new UserRefusedOnDevice())), [settle, onError]);

  const [intent] = useState(() =>
    createIntent(
      hyperliquidSignIntentLWMDefinition,
      buildHyperliquidSignIntentInput(signOnSession),
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

    if (result.type === "signed") {
      settle(() => onSuccess({ signatures: result.signatures }));
      onClose();
      return;
    }
    settle(() => onError(result.error));
  }, [settle, onSuccess, onError, onClose]);

  const onUserCancel = useCallback(() => {
    settle(() => onError(new UserRefusedOnDevice()));
    onClose();
  }, [settle, onError, onClose]);

  return {
    deviceInitializationInput,
    intent,
    onIntentJobComplete,
    onUserCancel,
  };
}
