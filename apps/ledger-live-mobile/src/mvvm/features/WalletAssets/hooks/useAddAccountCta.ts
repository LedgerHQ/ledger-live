import { useCallback, useState } from "react";
import { track } from "~/analytics";

interface UseAddAccountCtaResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useAddAccountCta(): UseAddAccountCtaResult {
  const [isOpen, setOpen] = useState(false);

  const open = useCallback(() => {
    track("button_clicked", { button: "add_account_cta" });
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { isOpen, open, close };
}
