import { useCallback, useMemo } from "react";
import type { DepositOptionId, DepositOptionsProps, DepositOptionsViewModel } from "../../types";

const OPTION_ORDER: readonly DepositOptionId[] = ["bankTransfer", "swap", "receive", "buy"];

const TRACK_BUTTON: Readonly<Record<DepositOptionId, string>> = {
  bankTransfer: "bank transfer",
  swap: "swap",
  receive: "receive via crypto address",
  buy: "buy",
};

export function useDepositOptionsViewModel({
  labels,
  page,
  onSelect,
  onClose,
  onTrackEvent,
}: DepositOptionsProps): DepositOptionsViewModel {
  const options = useMemo(() => OPTION_ORDER.map(id => ({ id, ...labels.options[id] })), [labels]);

  const onSelectOption = useCallback(
    (id: DepositOptionId) => {
      onTrackEvent?.("button_clicked", {
        button: TRACK_BUTTON[id],
        buttonLocation: "deposit",
        page,
      });
      onSelect(id);
      onClose();
    },
    [onSelect, onClose, onTrackEvent, page],
  );

  return { options, onSelectOption };
}
