import { MakeModalsType } from "~/renderer/modals/types";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";

export type ModalsData = {
  MODAL_BITCOIN_EDIT_TRANSACTION: EditTransactionModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_BITCOIN_EDIT_TRANSACTION: EditTransactionModal,
};

export default modals;
