import React, { useCallback, useState } from "react";
import { SwapTransactionType } from "@ledgerhq/live-common/src/exchange/swap/types";
import { ExchangeRate } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { postSwapCancelled } from "@ledgerhq/live-common/lib/exchange/swap";
import { Confirmation, DeviceMeta } from "./Confirmation";
import GenericErrorBottomModal from "../../../../components/GenericErrorBottomModal";

export function Modal({
  provider,
  confirmed,
  onClose,
  swapTx,
  deviceMeta,
  exchangeRate,
}: {
  provider?: string;
  confirmed: boolean;
  onClose: () => void;
  swapTx: SwapTransactionType;
  deviceMeta?: DeviceMeta;
  exchangeRate?: ExchangeRate;
}) {
  const [error, setError] = useState<Error>();

  const onError = useCallback(
    ({ error, swapId }) => {
      if (!exchangeRate) {
        return;
      }
      // Consider the swap as cancelled (on provider perspective) in case of error
      postSwapCancelled({ provider: exchangeRate.provider, swapId });

      setError(error);
    },
    [exchangeRate],
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
