import { track } from "@shared/analytics";
import { useCallback, useState } from "react";
import { useRoute } from "@react-navigation/native";

interface UseAddAccountCtaResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useAddAccountCta(): UseAddAccountCtaResult {
  const [isOpen, setOpen] = useState(false);
  const route = useRoute();

  const open = useCallback(() => {
    track("button_clicked", { button: "account_cta", type: "add", page: route.name });
    setOpen(true);
  }, [route.name]);

  const close = useCallback(() => setOpen(false), []);

  return { isOpen, open, close };
}
