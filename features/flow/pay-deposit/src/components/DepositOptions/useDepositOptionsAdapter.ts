import { useCallback, useState } from "react";
import type { DepositOptionId, DepositOptionsProps } from "../../types";

export type UseDepositOptionsAdapterParams = Readonly<{
  page: string;
  onSelect: (id: DepositOptionId) => void;
}>;

export type UseDepositOptionsAdapter = Readonly<{
  open: () => void;
  depositOptions: DepositOptionsProps;
}>;

export function useDepositOptionsAdapter({
  page,
  onSelect,
}: UseDepositOptionsAdapterParams): UseDepositOptionsAdapter {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  return {
    open,
    depositOptions: { isOpen, page, onClose, onSelect },
  };
}
