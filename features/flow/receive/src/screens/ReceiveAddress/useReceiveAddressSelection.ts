import { useCallback, useMemo, useState } from "react";
import type { AccountReceive } from "@domain/entity-account-receive";
import {
  toReceiveAddressOptions,
  type ReceiveAddressOption,
  type ReceiveAddressOptionId,
} from "../../logic/toReceiveAddressOptions";
import {
  trackReceiveAddressButton,
  type ReceiveAddressButton,
  type ReceiveAddressTracking,
} from "./receiveAddressTracking";

const OPTION_BUTTON: Readonly<Record<ReceiveAddressOptionId, ReceiveAddressButton>> = {
  transparent: "public address",
  shielded: "private address",
};

export type ReceiveAddressSelection = Readonly<{
  options: readonly ReceiveAddressOption[];
  /** Absent while the user has to pick one of several addresses, or before `receive` is read. */
  selected: ReceiveAddressOption | undefined;
  /** The user picks one of several addresses (Zcash) before the screen shows it. */
  isSelecting: boolean;
  select: (id: ReceiveAddressOptionId) => void;
  /** Back to the choice, offered once one of several addresses is shown. */
  backToSelection: (() => void) | undefined;
}>;

/** Which of the account's addresses the screen shows: the only one, or the one the user picked. */
export function useReceiveAddressSelection(
  receive: AccountReceive | undefined,
  tracking: ReceiveAddressTracking,
): ReceiveAddressSelection {
  const options = useMemo(() => (receive ? toReceiveAddressOptions(receive) : []), [receive]);
  const hasChoice = options.length > 1;
  const [pickedId, setPickedId] = useState<ReceiveAddressOptionId>();

  const select = useCallback(
    (id: ReceiveAddressOptionId) => {
      trackReceiveAddressButton(OPTION_BUTTON[id], tracking);
      setPickedId(id);
    },
    [tracking],
  );
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
