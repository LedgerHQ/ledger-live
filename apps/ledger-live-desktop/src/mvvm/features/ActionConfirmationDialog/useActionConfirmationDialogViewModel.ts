import type { ActionDialogIcon } from "@ledgerhq/live-common/wallet-api/validation/actionDialogParams";
import { useSelector } from "LLD/hooks/redux";
import { selectActionDialog } from "~/renderer/reducers/actionDialog";
import { resolveActionDialog } from "~/renderer/components/WebPTXPlayer/actionDialogStore";

export interface ActionConfirmationDialogViewProps {
  isOpen: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  icon: ActionDialogIcon;
  onConfirm: () => void;
  onDismiss: () => void;
}

const onDismiss = () => resolveActionDialog(false);
const onConfirm = () => resolveActionDialog(true);

const useActionConfirmationDialogViewModel = (): ActionConfirmationDialogViewProps => {
  const data = useSelector(selectActionDialog);

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
