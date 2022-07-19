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

export function Modal({
  provider,
  confirmed,
  onClose,
  termsAccepted,
  swapTx,
  deviceMeta,
  exchangeRate,
}: {
  provider?: string;
  confirmed: boolean;
  termsAccepted: boolean;
  onClose: () => void;
  swapTx: SwapTransactionType;
  deviceMeta?: DeviceMeta;
  exchangeRate?: ExchangeRate;
}) {
  const dispatch = useDispatch();
  const [error, setError] = useState<Error>();

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
      onClose();
      if (!exchangeRate) {
        return;
      }
      // Consider the swap as cancelled (on provider perspective) in case of error
      postSwapCancelled({ provider: exchangeRate.provider, swapId });

      setError(error);
    },
    [exchangeRate, onClose],
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

      {deviceMeta && (
        <Confirmation
          isOpen={confirmed}
          provider={provider}
          onCancel={onClose}
          swapTx={swapTx}
          exchangeRate={exchangeRate}
          deviceMeta={deviceMeta}
          onError={onError}
        />
      )}

      {error && (
        // @ts-expect-error
        <GenericErrorBottomModal error={error} isOpened onClose={resetError} />
      )}
    </>
  );
}

enum Target {
  Terms,
  Confirmation,
  None,
}
