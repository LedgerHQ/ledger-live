import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { selectActionDialog } from "~/renderer/reducers/actionDialog";
import { resolveActionDialog } from "~/renderer/components/WebPTXPlayer/actionDialogStore";

export interface ActionConfirmationDialogViewProps {
  isOpen: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  icon: "info" | "warning" | "success";
  onConfirm: () => void;
  onDismiss: () => void;
}

const useActionConfirmationDialogViewModel = (): ActionConfirmationDialogViewProps => {
  const data = useSelector(selectActionDialog);

  const onDismiss = useCallback(() => {
    resolveActionDialog(false);
  }, []);

  const onConfirm = useCallback(() => {
    resolveActionDialog(true);
  }, []);

  return {
    isOpen: data != null,
    title: data?.title ?? "",
    description: data?.description ?? "",
    ctaLabel: data?.ctaLabel ?? "",
    icon: data?.icon ?? "info",
    onConfirm,
    onDismiss,
  };
};

export default useActionConfirmationDialogViewModel;
