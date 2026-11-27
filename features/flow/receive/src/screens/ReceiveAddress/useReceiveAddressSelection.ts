import { useCallback, useMemo, useState } from "react";
import type { AccountReceive } from "@domain/entity-account-receive";
import {
  toReceiveAddressOptions,
  type ReceiveAddressOption,
  type ReceiveAddressOptionId,
} from "../../logic/toReceiveAddressOptions";
import { trackReceiveAddressButton, type ReceiveAddressButton } from "./receiveAddressTracking";

const OPTION_BUTTON: Readonly<Record<ReceiveAddressOptionId, ReceiveAddressButton>> = {
  transparent: "public address",
  shielded: "private address",
};

export type ReceiveAddressSelection = Readonly<{
  options: readonly ReceiveAddressOption[];
  selected: ReceiveAddressOption | undefined;
  isSelecting: boolean;
  select: (id: ReceiveAddressOptionId) => void;
  backToSelection: (() => void) | undefined;
}>;

export function useReceiveAddressSelection(
  receive: AccountReceive | undefined,
): ReceiveAddressSelection {
  const options = useMemo(() => (receive ? toReceiveAddressOptions(receive) : []), [receive]);
  const hasChoice = options.length > 1;
  const [pickedId, setPickedId] = useState<ReceiveAddressOptionId>();

  const select = useCallback((id: ReceiveAddressOptionId) => {
    trackReceiveAddressButton(OPTION_BUTTON[id]);
    setPickedId(id);
  }, []);
  const backToSelection = useCallback(() => setPickedId(undefined), []);

  const selected = hasChoice ? options.find(option => option.id === pickedId) : options[0];

  return {
    options,
    selected,
    isSelecting: hasChoice && !selected,
    select,
    backToSelection: hasChoice && selected ? backToSelection : undefined,
  };
}
