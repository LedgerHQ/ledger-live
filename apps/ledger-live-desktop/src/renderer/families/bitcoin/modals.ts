import { MakeModalsType } from "~/renderer/modals/types";
import { Data as ExportKeyProps } from "./ZCashExportKeyFlowModal/Body";
import MODAL_ZCASH_EXPORT_KEY from "./ZCashExportKeyFlowModal";

export type ModalsData = {
  MODAL_ZCASH_EXPORT_KEY: ExportKeyProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ZCASH_EXPORT_KEY,
};

export default modals;
