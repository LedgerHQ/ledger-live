import { useCallback, useState } from "react";
import type { ContactsSubView, ContactsViewModel } from "../types";

export const useContactsViewModel = (): ContactsViewModel => {
  const [isOpen, setOpen] = useState(false);
  const [subView, setSubView] = useState<ContactsSubView>("overview");

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSubView("overview");
  }, []);

  return { isOpen, onOpenChange, subView, setSubView };
};
