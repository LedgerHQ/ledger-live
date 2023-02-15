import React, { useMemo, useCallback, useState } from "react";
import {
  SwapTransactionType,
  ExchangeRate,
} from "@ledgerhq/live-common/exchange/swap/types";
import { postSwapCancelled } from "@ledgerhq/live-common/exchange/swap/index";
import { useDispatch } from "react-redux";
import GenericErrorBottomModal from "../../../../components/GenericErrorBottomModal";
import { Confirmation, DeviceMeta } from "./Confirmation";
import { Terms } from "./Terms";
import { swapAcceptProvider } from "../../../../actions/settings";
import { useAnalytics } from "../../../../analytics";
import { sharedSwapTracking } from "../../utils";

export function Modal({
  confirmed,
  onClose,
  termsAccepted,
  swapTx,
  deviceMeta,
  exchangeRate,
}: {
  confirmed: boolean;
  termsAccepted: boolean;
  onClose: () => void;
  swapTx: SwapTransactionType;
  deviceMeta?: DeviceMeta;
  exchangeRate?: ExchangeRate;
}) {
  const { track } = useAnalytics();
  const dispatch = useDispatch();
  const [error, setError] = useState<Error>();
  const provider = exchangeRate?.provider;

  const target = useMemo(() => {
    if (!confirmed) {
      return Target.None;
    }

    if (!termsAccepted) {
      return Target.Terms;
    }

    if (!deviceMeta) {
      return Target.None;
    }

    return Target.Confirmation;
  }, [confirmed, termsAccepted, deviceMeta]);

  const onAcceptTerms = useCallback(() => {
    if (!provider || provider === "ftx" || provider === "ftxus") {
      return;
    }

    dispatch(swapAcceptProvider(provider));
  }, [dispatch, provider]);

  const onError = useCallback(
    ({ error, swapId }) => {
      track("error_message", {
        ...sharedSwapTracking,
        message: "drawer_error",
        page: "Page Swap Drawer",
        error: error?.name ?? "unknown",
      });
      if (!exchangeRate) {
        return;
      }
      // Consider the swap as cancelled (on provider perspective) in case of error
      postSwapCancelled({ provider: exchangeRate.provider, swapId });

      setError(error);
    },
    [exchangeRate, track],
  );

  const resetError = useCallback(() => {
    setError(undefined);
    onClose();
  }, [onClose]);

  if (!provider) {
    return null;
  }

  return (
    <>
      {provider !== "ftx" && provider !== "ftxus" && (
        <Terms
          provider={provider}
          onClose={onClose}
          onCTA={onAcceptTerms}
          isOpen={target === Target.Terms}
        />
      )}

      {deviceMeta && confirmed && !error && (
        <Confirmation
          isOpen={confirmed}
          onCancel={onClose}
          swapTx={swapTx}
          exchangeRate={exchangeRate}
          deviceMeta={deviceMeta}
          onError={onError}
        />
      )}

      {error && <GenericErrorBottomModal error={error} onClose={resetError} />}
    </>
  );
}

enum Target {
  Terms,
  Confirmation,
  None,
}
