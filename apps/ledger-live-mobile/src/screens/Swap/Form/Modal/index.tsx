import React, { useMemo, useCallback } from "react";
import { SwapTransactionType } from "@ledgerhq/live-common/src/exchange/swap/types";
import { useDispatch, useSelector } from "react-redux";
import { Terms } from "./Terms";
import { Confirmation } from "./Confirmation";
import { swapAcceptProvider } from "../../../../actions/settings";
import { swapAcceptedProvidersSelector } from "../../../../reducers/settings";

export function Modal({
  provider,
  confirmed,
  onClose,
  swapTx,
}: {
  provider?: string;
  confirmed: boolean;
  onClose: () => void;
  swapTx: SwapTransactionType;
}) {
  const dispatch = useDispatch();
  const swapAcceptedProviders = useSelector(swapAcceptedProvidersSelector);
  const termsAccepted = (swapAcceptedProviders || []).includes(provider ?? "");
  const target = useMemo(() => {
    if (!confirmed) {
      return Target.None;
    }

    if (!termsAccepted) {
      return Target.Terms;
    }

    return Target.Confirmation;
  }, [confirmed, termsAccepted]);

  const onAcceptTerms = useCallback(() => {
    if (!provider) {
      return;
    }

    dispatch(swapAcceptProvider(provider));
  }, [dispatch, provider]);

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

      {/* <Confirmation
        isOpened={target === Target.Confirmation}
        provider={provider}
        onCancel={onClose}
        swapTx={swapTx}
      /> */}
    </>
  );
}

enum Target {
  Terms,
  Confirmation,
  None,
}
