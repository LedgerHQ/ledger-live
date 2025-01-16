import { useCallback, useState } from "react";
import type { DerivationMode } from "@ledgerhq/types-live";

export default function useAddressTypeTooltipViewModel(
  accountSchemes: Array<DerivationMode> | null | undefined,
) {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const formattedAccountSchemes = accountSchemes
    ? accountSchemes.map(a => (a === "" ? "legacy" : a))
    : [];

  return { isOpen, onOpen, onClose, formattedAccountSchemes };
}
