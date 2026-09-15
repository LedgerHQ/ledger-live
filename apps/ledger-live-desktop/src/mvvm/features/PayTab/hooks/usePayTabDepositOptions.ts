import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  useBankTransferIntroAdapter,
  type BankTransferHandoff,
  type BankTransferIntroProps,
} from "@features/flow-pay-bank-transfer";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type PayCardTrackEvent,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-deposit";
import { useOpenAssetFlow } from "../../ModularDialog/hooks/useOpenAssetFlow";

const DEPOSIT_PAGE = "Pay";

const DEPOSIT_CATEGORIES = [AssetCategory.Stablecoins] as const;

export type UsePayTabDepositOptions = UseDepositOptionsAdapter & {
  bankTransferIntro: BankTransferIntroProps;
};

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

  const onBankTransfer = useCallback(
    (handoff: BankTransferHandoff) => {
      navigate({
        pathname: "/bank",
        search: `?noahAuth=${handoff}`,
      });
    },
    [navigate],
  );

  const { open: openBankTransferIntro, bankTransferIntro } = useBankTransferIntroAdapter({
    onBankTransfer,
    onTrackEvent,
  });

  const onSelect = useCallback(
    (id: DepositOptionId) => {
      switch (id) {
        case "bankTransfer":
          openBankTransferIntro();
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
    [openBankTransferIntro, navigate, openAssetFlow],
  );

  const { open, depositOptions } = useDepositOptionsAdapter({
    page: DEPOSIT_PAGE,
    onSelect,
    onTrackEvent,
  });

  return { open, depositOptions, bankTransferIntro };
}
