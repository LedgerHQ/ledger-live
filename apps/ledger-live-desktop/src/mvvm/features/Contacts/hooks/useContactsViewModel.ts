import { useCallback, useState } from "react";
import type { ContactsSubView, ContactsViewModel } from "../types";

export const useContactsViewModel = (): ContactsViewModel => {
  const [isOpen, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subView, setSubView] = useState<ContactsSubView>("actions");

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSubView("actions");
  }, []);

  return { isOpen, onOpenChange, sessionId, setSessionId, subView, setSubView };
};
