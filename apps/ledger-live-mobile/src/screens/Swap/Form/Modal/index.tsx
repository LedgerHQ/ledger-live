import React, { useMemo, useCallback } from "react";
import { SwapTransactionType } from "@ledgerhq/live-common/src/exchange/swap/types";
import { useDispatch } from "react-redux";
import { ExchangeRate } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { Terms } from "./Terms";
import { Confirmation, DeviceMeta } from "./Confirmation";
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
    if (!provider) {
      return;
    }

    dispatch(swapAcceptProvider(provider));
  }, [dispatch, provider]);

  // TODO: swap
  const onError = useCallback(() => {}, []);

  if (!provider) {
    return null;
  }

  return (
    <>
      <Terms
        provider={provider}
        onClose={onClose}
        onCTA={onAcceptTerms}
        isOpen={target === Target.Terms}
      />

      {deviceMeta && (
        <Confirmation
          isOpen={target === Target.Confirmation}
          provider={provider}
          onCancel={onClose}
          swapTx={swapTx}
          exchangeRate={exchangeRate}
          deviceMeta={deviceMeta}
          onError={onError}
        />
      )}
    </>
  );
}

enum Target {
  Terms,
  Confirmation,
  None,
}
