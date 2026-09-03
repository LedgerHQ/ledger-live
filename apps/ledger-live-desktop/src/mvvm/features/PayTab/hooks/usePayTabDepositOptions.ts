import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { AssetCategory } from "@domain/api-aggregated-assets";
import {
  useBankTransferIntroAdapter,
  type BankTransferHandoff,
  type BankTransferIntroLabels,
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
  const { t } = useTranslation();
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

  const introLabels: BankTransferIntroLabels = {
    title: t("payTab.bankTransferIntro.title"),
    description: t("payTab.bankTransferIntro.description"),
    createAccountLabel: t("payTab.bankTransferIntro.createAccount"),
    logInLabel: t("payTab.bankTransferIntro.logIn"),
    providedBy: t("payTab.bankTransferIntro.providedBy"),
    rows: [
      {
        icon: "Bank",
        title: t("payTab.bankTransferIntro.rows.bank.title"),
        description: t("payTab.bankTransferIntro.rows.bank.description"),
      },
      {
        icon: "Coins",
        title: t("payTab.bankTransferIntro.rows.fees.title"),
        description: t("payTab.bankTransferIntro.rows.fees.description"),
      },
      {
        icon: "Chart5",
        title: t("payTab.bankTransferIntro.rows.earn.title"),
        description: t("payTab.bankTransferIntro.rows.earn.description"),
      },
    ],
  };

  const { open: openBankTransferIntro, bankTransferIntro } = useBankTransferIntroAdapter({
    labels: introLabels,
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
