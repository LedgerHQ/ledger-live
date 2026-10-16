import type { ActionMenuDialogOption } from "@ledgerhq/live-common/wallet-api/validation/actionMenuDialogParams";
import { useSelector } from "LLD/hooks/redux";
import { selectActionMenuDialog } from "~/renderer/reducers/actionMenuDialog";
import { resolveActionMenuDialog } from "~/renderer/components/WebPTXPlayer/actionMenuDialogStore";

export interface ActionMenuDialogViewProps {
  isOpen: boolean;
  options: ActionMenuDialogOption[];
  onSelect: (optionId: string) => void;
  onDismiss: () => void;
}

const onDismiss = () => resolveActionMenuDialog(null);
const onSelect = (optionId: string) => resolveActionMenuDialog(optionId);

const useActionMenuDialogViewModel = (): ActionMenuDialogViewProps => {
  const data = useSelector(selectActionMenuDialog);

  return {
    isOpen: data != null,
    options: data?.options ?? [],
    onSelect,
    onDismiss,
  };
};

export default useActionMenuDialogViewModel;
