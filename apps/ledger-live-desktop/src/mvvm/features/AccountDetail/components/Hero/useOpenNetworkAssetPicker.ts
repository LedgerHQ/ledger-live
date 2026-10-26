import { useCallback } from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useDispatch } from "LLD/hooks/redux";
import {
  closeDialog,
  openDialog,
  setFlowValue,
  setSourceValue,
} from "~/renderer/reducers/modularDialog";
import { ACCOUNT_DETAIL_TRACKING_PAGE_NAME } from "../../constants";

export type OpenNetworkAssetPicker = (
  networkId: string,
  useCase: string,
  onPicked: (currency: CryptoOrTokenCurrency) => void,
) => void;

export function useOpenNetworkAssetPicker(): OpenNetworkAssetPicker {
  const dispatch = useDispatch();
  return useCallback(
    (networkId, useCase, onPicked) => {
      dispatch(setFlowValue(useCase));
      dispatch(setSourceValue(ACCOUNT_DETAIL_TRACKING_PAGE_NAME));
      dispatch(
        openDialog({
          networkIds: [networkId],
          useCase,
          dialogConfiguration: {
            assets: { rightElement: "marketTrend" },
            networks: { rightElement: "undefined" },
          },
          onAssetSelected: currency => {
            dispatch(closeDialog());
            onPicked(currency);
          },
          onClose: () => dispatch(closeDialog()),
        }),
      );
    },
    [dispatch],
  );
}
