import { useCallback, useState } from "react";
import type { ContactsViewModel } from "../types";

export const useContactsViewModel = (): ContactsViewModel => {
  const [isOpen, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  return { isOpen, onOpenChange, sessionId, setSessionId };
};
