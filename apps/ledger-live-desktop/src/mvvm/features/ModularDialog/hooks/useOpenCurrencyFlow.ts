import { useCallback, useEffect, useRef } from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useDispatch, useStore } from "LLD/hooks/redux";
import {
  closeDialog,
  openDialog,
  type ModularDialogPresentation,
} from "~/renderer/reducers/modularDialog";

type SettleCurrencySelection = (currency: CryptoOrTokenCurrency | null) => boolean;

type PendingCurrencySelection = Readonly<{
  requestId: object;
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void;
  settle: SettleCurrencySelection;
}>;

export type OpenCurrencyFlow = (
  networkIds: readonly CryptoCurrency["id"][],
  options?: Readonly<{
    presentation?: ModularDialogPresentation;
  }>,
) => Promise<CryptoOrTokenCurrency | null>;

export function useOpenCurrencyFlow(): Readonly<{
  openCurrencyFlow: OpenCurrencyFlow;
  cancelCurrencyFlow: () => void;
}> {
  const dispatch = useDispatch();
  const store = useStore();
  const pendingSelectionRef = useRef<PendingCurrencySelection | undefined>(undefined);

  const cancelCurrencyFlow = useCallback(() => {
    if (pendingSelectionRef.current?.settle(null)) {
      dispatch(closeDialog());
    }
  }, [dispatch]);

  const openCurrencyFlow = useCallback<OpenCurrencyFlow>(
    (networkIds, options) => {
      cancelCurrencyFlow();

      return new Promise(resolve => {
        let isSettled = false;
        const requestId = {};

        const settle: SettleCurrencySelection = currency => {
          if (isSettled) return false;

          isSettled = true;
          if (pendingSelectionRef.current?.requestId === requestId) {
            pendingSelectionRef.current = undefined;
          }
          resolve(currency);
          return true;
        };
        const onAssetSelected = (currency: CryptoOrTokenCurrency) => {
          if (settle(currency)) {
            dispatch(closeDialog());
          }
        };

        pendingSelectionRef.current = { requestId, onAssetSelected, settle };

        dispatch(
          openDialog({
            networkIds: [...networkIds],
            presentation: options?.presentation,
            onAssetSelected,
            onClose: () => {
              if (settle(null)) {
                dispatch(closeDialog());
              }
            },
          }),
        );
      });
    },
    [cancelCurrencyFlow, dispatch],
  );

  useEffect(
    () => () => {
      const pendingSelection = pendingSelectionRef.current;
      if (!pendingSelection) return;

      pendingSelection.settle(null);
      if (
        store.getState().modularDialog.dialogParams?.onAssetSelected ===
        pendingSelection.onAssetSelected
      ) {
        dispatch(closeDialog());
      }
    },
    [dispatch, store],
  );

  return { openCurrencyFlow, cancelCurrencyFlow };
}
