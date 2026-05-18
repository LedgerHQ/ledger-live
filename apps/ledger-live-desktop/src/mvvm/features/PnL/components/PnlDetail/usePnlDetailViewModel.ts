import { useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";

export type PnlDetailItem = {
  title: string;
  description: string;
  value: string;
};

type PnlDetailViewModelInput = {
  title: string;
  description: string;
  items: PnlDetailItem[];
};

export function usePnlDetailViewModel({ title, description, items }: PnlDetailViewModelInput) {
  const [isOpen, setIsOpen] = useState(false);
  const discreet = useSelector(discreetModeSelector);

  return {
    title,
    description,
    items,
    isOpen,
    onOpenChange: setIsOpen,
    discreet,
  };
}
