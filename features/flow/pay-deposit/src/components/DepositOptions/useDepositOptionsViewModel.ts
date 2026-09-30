import { useCallback, useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import type { DepositOptionId, DepositOptionsProps, DepositOptionsViewModel } from "../../types";

const OPTION_ORDER: readonly DepositOptionId[] = ["bankTransfer", "swap", "receive", "buy"];

const TRACK_BUTTON: Readonly<Record<DepositOptionId, string>> = {
  bankTransfer: "bank transfer",
  swap: "swap",
  receive: "receive via crypto address",
  buy: "buy",
};

export function useDepositOptionsViewModel({
  page,
  onSelect,
  onClose,
}: DepositOptionsProps): DepositOptionsViewModel {
  const { t } = useTranslation();

  const title = t("payTab.deposit.title");

  const options = useMemo(
    () =>
      OPTION_ORDER.map(id => ({
        id,
        title: t(`payTab.deposit.options.${id}.title`),
        description: t(`payTab.deposit.options.${id}.description`),
      })),
    [t],
  );

  const onSelectOption = useCallback(
    (id: DepositOptionId) => {
      trackButtonClicked({ button: TRACK_BUTTON[id], buttonLocation: "deposit", page });
      onSelect(id);
      onClose();
    },
    [onSelect, onClose, page],
  );

  return { title, options, onSelectOption };
}
