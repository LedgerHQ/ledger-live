import { useCallback } from "react";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
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
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { useOpenAssetAndAccount } from "../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";

const DEPOSIT_PAGE = "Pay";

const DEPOSIT_CATEGORIES = [AssetCategory.Stablecoins] as const;

export type UsePayTabDepositOptions = UseDepositOptionsAdapter & {
  bankTransferIntro: BankTransferIntroProps;
};

export function usePayTabDepositOptions(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabDepositOptions {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const onReceive = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      dispatch(
        openModal("MODAL_RECEIVE", {
          account,
          parentAccount,
          shouldUseReceiveOptions: false,
        }),
      );
    },
    [dispatch],
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
          openAssetAndAccount({
            categories: DEPOSIT_CATEGORIES,
            onSuccess: onReceive,
          });
          break;
      }
    },
    [openBankTransferIntro, navigate, openAssetAndAccount, onReceive],
  );

  const { open, depositOptions } = useDepositOptionsAdapter({
    page: DEPOSIT_PAGE,
    onSelect,
    onTrackEvent,
  });

  return { open, depositOptions, bankTransferIntro };
}
