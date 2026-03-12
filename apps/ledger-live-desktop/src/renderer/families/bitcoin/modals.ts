import { MakeModalsType } from "~/renderer/modals/types";
import { Data as ExportKeyProps } from "./ZCashExportKeyFlowModal/Body";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import MODAL_ZCASH_EXPORT_KEY from "./ZCashExportKeyFlowModal";

export type ModalsData = {
  MODAL_ZCASH_EXPORT_KEY: ExportKeyProps;
  MODAL_BITCOIN_EDIT_TRANSACTION: EditTransactionModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ZCASH_EXPORT_KEY,
  MODAL_BITCOIN_EDIT_TRANSACTION: EditTransactionModal,
};

export default modals;
