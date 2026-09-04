import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type PayCardTrackEvent,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-deposit";
import { useOpenAssetFlow } from "../../ModularDialog/hooks/useOpenAssetFlow";

const DEPOSIT_PAGE = "Pay";

const DEPOSIT_CATEGORIES = [AssetCategory.Stablecoins] as const;

export type UsePayTabDepositOptions = UseDepositOptionsAdapter;

export function usePayTabDepositOptions(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabDepositOptions {
  const navigate = useNavigate();

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    DEPOSIT_PAGE,
    "MODAL_RECEIVE",
    { shouldUseReceiveOptions: false },
  );

  const onSelect = useCallback(
    (id: DepositOptionId) => {
      switch (id) {
        case "bankTransfer":
          navigate("/bank");
          break;
        case "swap":
          navigate("/swap");
          break;
        case "buy":
          navigate("/exchange", { state: { mode: "buy", returnTo: "/paytab" } });
          break;
        case "receive":
          openAssetFlow(undefined, undefined, DEPOSIT_CATEGORIES);
          break;
      }
    },
    [navigate, openAssetFlow],
  );

  return useDepositOptionsAdapter({ page: DEPOSIT_PAGE, onSelect, onTrackEvent });
}
