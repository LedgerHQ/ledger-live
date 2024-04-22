import React, { useMemo, useCallback, useState } from "react";
import { SwapTransactionType, ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { postSwapCancelled } from "@ledgerhq/live-common/exchange/swap/index";
import { useDispatch, useSelector } from "react-redux";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { Confirmation, DeviceMeta } from "./Confirmation";
import { Terms } from "./Terms";
import { swapAcceptProvider } from "~/actions/settings";
import { useAnalytics } from "~/analytics";
import { sharedSwapTracking } from "../../utils";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import { knownDevicesSelector } from "~/reducers/ble";

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
  const [device] = useSelector(knownDevicesSelector);
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
    if (provider) {
      dispatch(swapAcceptProvider(provider));
    }
  }, [dispatch, provider]);

  const onError = useCallback(
    ({ error, swapId }: { error?: Error; swapId?: string }) => {
      track("error_message", {
        ...sharedSwapTracking,
        message: "drawer_error",
        page: "Page Swap Drawer",
        error: error?.name ?? "unknown",
      });
      if (!exchangeRate || !swapId) {
        return;
      }
      // Consider the swap as cancelled (on provider perspective) in case of error
      postSwapCancelled({
        provider: exchangeRate.provider,
        swapId: swapId ?? "",
        ...((error as CompleteExchangeError).step
          ? { swapStep: (error as CompleteExchangeError).step }
          : {}),
        statusCode: error?.name,
        errorMessage: error?.message,
        sourceCurrencyId: swapTx.swap.from.currency?.id,
        targetCurrencyId: swapTx.swap.to.currency?.id,
        ...(device ? { hardwareWalletType: device.modelId } : {}),
        swapType: exchangeRate?.tradeMethod,
      });

      setError(error);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Terms
        provider={provider}
        onClose={onClose}
        onCTA={onAcceptTerms}
        isOpen={target === Target.Terms}
      />

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
