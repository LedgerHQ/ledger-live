import { TransactionEditType } from "@ledgerhq/types-live";

export type EditTransactionStepId = "method" | "fees" | "summary" | "device" | "confirmation";

export const getEditTransactionStepTitleKey = (
  stepId: EditTransactionStepId,
  editType?: TransactionEditType,
): "operation.edit.title" | "operation.edit.cancel.title" | "operation.edit.speedUp.title" => {
  if (!editType || stepId === "method") {
    return "operation.edit.title";
  }

  return editType === "cancel" ? "operation.edit.cancel.title" : "operation.edit.speedUp.title";
};
