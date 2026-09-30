import { useCallback } from "react";
import { useNavigate } from "react-router";
import {
  useBankTransferIntroAdapter,
  type BankTransferHandoff,
  type BankTransferIntroProps,
} from "@features/flow-pay-bank-transfer";
import {
  useDepositOptionsAdapter,
  type DepositOptionId,
  type UseDepositOptionsAdapter,
} from "@features/flow-pay-deposit";

const DEPOSIT_PAGE = "Pay";

export type UsePayTabDepositOptions = UseDepositOptionsAdapter & {
  bankTransferIntro: BankTransferIntroProps;
};

export function usePayTabDepositOptions(onCryptoAddress: () => void): UsePayTabDepositOptions {
  const navigate = useNavigate();

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
          onCryptoAddress();
          break;
      }
    },
    [openBankTransferIntro, navigate, onCryptoAddress],
  );

  const { open, depositOptions } = useDepositOptionsAdapter({
    page: DEPOSIT_PAGE,
    onSelect,
  });

  return { open, depositOptions, bankTransferIntro };
}
